"""
Google OAuth2 PKCE Flow Service

This service handles OAuth2 authentication with PKCE for personal Google accounts,
allowing users to access their own Google Sheets from Google Drive.

OAuth2 PKCE (Proof Key for Code Exchange) is more secure than traditional OAuth2
and works well for applications that cannot securely store client secrets.
"""

import os
import json
import secrets
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


class GoogleOAuthService:
    """Service for OAuth2 PKCE authentication with Google"""

    # Google API scopes for reading Google Sheets and Drive
    SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly'
    ]

    def __init__(self, client_secrets_path: Optional[str] = None):
        """
        Initialize OAuth service

        Args:
            client_secrets_path: Path to OAuth client secrets JSON file
        """
        self.client_secrets_path = client_secrets_path or os.getenv(
            'GOOGLE_OAUTH_CLIENT_SECRETS',
            'src/api/config/oauth_client_secrets.json'
        )
        self.token_path = 'src/api/config/oauth_token.json'
        self.credentials = None
        self.sheets_service = None
        self.drive_service = None

    def generate_pkce_pair(self) -> tuple[str, str]:
        """
        Generate PKCE code verifier and challenge

        Returns:
            Tuple of (code_verifier, code_challenge)
        """
        # Generate random code verifier (43-128 characters)
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8')
        # Remove padding
        code_verifier = code_verifier.replace('=', '')

        # Generate code challenge (SHA256 hash of verifier)
        code_challenge = hashlib.sha256(code_verifier.encode('utf-8')).digest()
        code_challenge = base64.urlsafe_b64encode(code_challenge).decode('utf-8')
        code_challenge = code_challenge.replace('=', '')

        return code_verifier, code_challenge

    def get_authorization_url(self, redirect_uri: str, state: Optional[str] = None) -> tuple[str, str, str]:
        """
        Get OAuth2 authorization URL with PKCE

        Args:
            redirect_uri: URL to redirect after authorization
            state: Optional state parameter for CSRF protection

        Returns:
            Tuple of (authorization_url, state, code_verifier)
        """
        if not os.path.exists(self.client_secrets_path):
            raise FileNotFoundError(
                f"OAuth client secrets not found at {self.client_secrets_path}. "
                "Please download from Google Cloud Console."
            )

        # Generate PKCE parameters
        code_verifier, code_challenge = self.generate_pkce_pair()

        # Generate state for CSRF protection if not provided
        if not state:
            state = secrets.token_urlsafe(32)

        # Create flow
        flow = Flow.from_client_secrets_file(
            self.client_secrets_path,
            scopes=self.SCOPES,
            redirect_uri=redirect_uri
        )

        # Add PKCE parameters
        authorization_url, _ = flow.authorization_url(
            access_type='offline',  # Get refresh token
            include_granted_scopes='true',
            prompt='consent',  # Force consent screen to get refresh token
            state=state,
            code_challenge=code_challenge,
            code_challenge_method='S256'
        )

        return authorization_url, state, code_verifier

    def exchange_code_for_token(
        self,
        code: str,
        code_verifier: str,
        redirect_uri: str
    ) -> Credentials:
        """
        Exchange authorization code for access token

        Args:
            code: Authorization code from callback
            code_verifier: PKCE code verifier
            redirect_uri: Same redirect URI used in authorization

        Returns:
            Google Credentials object
        """
        flow = Flow.from_client_secrets_file(
            self.client_secrets_path,
            scopes=self.SCOPES,
            redirect_uri=redirect_uri
        )

        # Exchange code for token with PKCE
        flow.fetch_token(
            code=code,
            code_verifier=code_verifier
        )

        self.credentials = flow.credentials

        # Save tokens
        self.save_credentials(self.credentials)

        return self.credentials

    def save_credentials(self, credentials: Credentials):
        """Save credentials to file"""
        os.makedirs(os.path.dirname(self.token_path), exist_ok=True)

        token_data = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes,
            'expiry': credentials.expiry.isoformat() if credentials.expiry else None
        }

        with open(self.token_path, 'w') as f:
            json.dump(token_data, f, indent=2)

    def load_credentials(self) -> Optional[Credentials]:
        """Load saved credentials from file"""
        if not os.path.exists(self.token_path):
            return None

        try:
            with open(self.token_path, 'r') as f:
                token_data = json.load(f)

            credentials = Credentials(
                token=token_data.get('token'),
                refresh_token=token_data.get('refresh_token'),
                token_uri=token_data.get('token_uri'),
                client_id=token_data.get('client_id'),
                client_secret=token_data.get('client_secret'),
                scopes=token_data.get('scopes')
            )

            # Set expiry if available
            if token_data.get('expiry'):
                credentials.expiry = datetime.fromisoformat(token_data['expiry'])

            # Refresh if expired
            if credentials.expired and credentials.refresh_token:
                from google.auth.transport.requests import Request
                credentials.refresh(Request())
                self.save_credentials(credentials)

            self.credentials = credentials
            return credentials

        except Exception as e:
            print(f"Error loading credentials: {e}")
            return None

    def is_authenticated(self) -> bool:
        """Check if user is authenticated"""
        if not self.credentials:
            self.credentials = self.load_credentials()

        return self.credentials is not None and self.credentials.valid

    def authenticate(self) -> bool:
        """
        Authenticate with saved credentials

        Returns:
            True if authenticated successfully
        """
        self.credentials = self.load_credentials()

        if not self.credentials:
            return False

        try:
            # Initialize services
            self.sheets_service = build('sheets', 'v4', credentials=self.credentials)
            self.drive_service = build('drive', 'v3', credentials=self.credentials)
            return True

        except Exception as e:
            print(f"Authentication failed: {e}")
            return False

    def list_spreadsheets(self, max_results: int = 100) -> list[Dict]:
        """
        List all Google Sheets files in user's Drive

        Args:
            max_results: Maximum number of files to return

        Returns:
            List of spreadsheet files
        """
        if not self.drive_service:
            if not self.authenticate():
                raise Exception("Not authenticated")

        try:
            results = self.drive_service.files().list(
                q="mimeType='application/vnd.google-apps.spreadsheet'",
                pageSize=max_results,
                fields="files(id, name, modifiedTime, webViewLink)"
            ).execute()

            files = results.get('files', [])
            return files

        except HttpError as error:
            print(f"An error occurred: {error}")
            raise

    def get_spreadsheet_data(
        self,
        spreadsheet_id: str,
        range_name: str = 'Transactions!A:E'
    ) -> list[list[str]]:
        """
        Get data from a specific spreadsheet

        Args:
            spreadsheet_id: The ID of the spreadsheet
            range_name: The A1 notation range

        Returns:
            List of rows
        """
        if not self.sheets_service:
            if not self.authenticate():
                raise Exception("Not authenticated")

        try:
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=range_name
            ).execute()

            values = result.get('values', [])
            return values

        except HttpError as error:
            print(f"An error occurred: {error}")
            raise

    def get_transactions(
        self,
        spreadsheet_id: str,
        sheet_range: str = 'Transactions!A:E'
    ) -> list[Dict]:
        """
        Get transactions from Google Sheet (OAuth version)

        Expected columns:
        - Column A: Date (YYYY-MM-DD)
        - Column B: Category
        - Column C: Subcategory
        - Column D: Amount
        - Column E: Description (optional)

        Args:
            spreadsheet_id: The spreadsheet ID
            sheet_range: The range to read

        Returns:
            List of transaction dictionaries
        """
        rows = self.get_spreadsheet_data(spreadsheet_id, sheet_range)

        if not rows:
            return []

        # Skip header row
        data_rows = rows[1:] if len(rows) > 1 else []

        transactions = []
        for i, row in enumerate(data_rows, start=2):
            try:
                date_str = row[0] if len(row) > 0 else ''
                category = row[1] if len(row) > 1 else ''
                subcategory = row[2] if len(row) > 2 else ''
                amount_str = row[3] if len(row) > 3 else '0'
                description = row[4] if len(row) > 4 else ''

                if not date_str or not category:
                    continue

                # Parse date
                try:
                    datetime.strptime(date_str, '%Y-%m-%d')
                except ValueError:
                    print(f"Warning: Invalid date in row {i}: {date_str}")
                    continue

                # Parse amount
                try:
                    amount = float(amount_str.replace('$', '').replace(',', ''))
                except ValueError:
                    print(f"Warning: Invalid amount in row {i}: {amount_str}")
                    continue

                transactions.append({
                    'Date': date_str,
                    'Category': category.strip(),
                    'Subcategory': subcategory.strip(),
                    'Amount': amount,
                    'Description': description.strip()
                })

            except Exception as e:
                print(f"Error processing row {i}: {e}")
                continue

        return transactions

    def logout(self):
        """Clear saved credentials"""
        if os.path.exists(self.token_path):
            os.remove(self.token_path)
        self.credentials = None
        self.sheets_service = None
        self.drive_service = None


def test_oauth_service():
    """Test OAuth service"""
    print("OAuth2 service initialized. Use the Flask API endpoints to authenticate:")
    print("1. Visit: http://budget.local:5000/api/oauth/login")
    print("2. Authorize with your Google account")
    print("3. You'll be redirected back to the app")
    print("4. Access your spreadsheets via API")


if __name__ == '__main__':
    test_oauth_service()

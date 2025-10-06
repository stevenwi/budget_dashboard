"""
Google Sheets Integration Service

This service handles authentication and data retrieval from Google Sheets
to populate transaction/spending data in the budget application.

Setup Instructions:
1. Enable Google Sheets API in Google Cloud Console
2. Create OAuth 2.0 credentials or Service Account
3. Download credentials JSON file
4. Place credentials in src/api/config/google_credentials.json
5. Set GOOGLE_SHEETS_ID in environment or config
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Optional
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class GoogleSheetsService:
    """Service for interacting with Google Sheets API"""

    # Google Sheets API scopes
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

    def __init__(self, credentials_path: Optional[str] = None, spreadsheet_id: Optional[str] = None):
        """
        Initialize Google Sheets service

        Args:
            credentials_path: Path to Google service account credentials JSON
            spreadsheet_id: The ID of the Google Spreadsheet to read from
        """
        self.credentials_path = credentials_path or os.getenv(
            'GOOGLE_CREDENTIALS_PATH',
            'src/api/config/google_credentials.json'
        )
        self.spreadsheet_id = spreadsheet_id or os.getenv('GOOGLE_SHEETS_ID')
        self.service = None

    def authenticate(self):
        """Authenticate with Google Sheets API using service account"""
        try:
            if not os.path.exists(self.credentials_path):
                raise FileNotFoundError(
                    f"Google credentials file not found at {self.credentials_path}. "
                    "Please download credentials from Google Cloud Console."
                )

            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_path,
                scopes=self.SCOPES
            )

            self.service = build('sheets', 'v4', credentials=credentials)
            return True

        except Exception as e:
            print(f"Authentication error: {e}")
            return False

    def read_sheet_data(self, range_name: str = 'Transactions!A:E') -> List[List[str]]:
        """
        Read data from specified sheet range

        Args:
            range_name: The A1 notation range to read (e.g., 'Sheet1!A1:E100')

        Returns:
            List of rows, where each row is a list of cell values
        """
        if not self.service:
            if not self.authenticate():
                raise Exception("Failed to authenticate with Google Sheets API")

        if not self.spreadsheet_id:
            raise ValueError("Spreadsheet ID not configured")

        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=range_name
            ).execute()

            values = result.get('values', [])
            return values

        except HttpError as error:
            print(f"An error occurred: {error}")
            raise

    def get_transactions(self, sheet_range: str = 'Transactions!A:E') -> List[Dict]:
        """
        Get transactions from Google Sheet and convert to standard format

        Expected columns in sheet:
        - Column A: Date (YYYY-MM-DD)
        - Column B: Category
        - Column C: Subcategory
        - Column D: Amount
        - Column E: Description (optional)

        Args:
            sheet_range: The range to read from (default: 'Transactions!A:E')

        Returns:
            List of transaction dictionaries
        """
        rows = self.read_sheet_data(sheet_range)

        if not rows:
            return []

        # Skip header row
        headers = rows[0] if rows else []
        data_rows = rows[1:] if len(rows) > 1 else []

        transactions = []
        for i, row in enumerate(data_rows, start=2):  # Start at 2 (Excel row number)
            try:
                # Handle rows with missing columns
                date_str = row[0] if len(row) > 0 else ''
                category = row[1] if len(row) > 1 else ''
                subcategory = row[2] if len(row) > 2 else ''
                amount_str = row[3] if len(row) > 3 else '0'
                description = row[4] if len(row) > 4 else ''

                # Skip empty rows
                if not date_str or not category:
                    continue

                # Parse and validate date
                try:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                except ValueError:
                    print(f"Warning: Invalid date format in row {i}: {date_str}")
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

    def sync_to_csv(self, output_path: str = 'src/api/data/transactions.csv') -> int:
        """
        Sync Google Sheet transactions to local CSV file

        Args:
            output_path: Path to output CSV file

        Returns:
            Number of transactions synced
        """
        import csv

        transactions = self.get_transactions()

        if not transactions:
            print("No transactions found in Google Sheet")
            return 0

        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Write to CSV
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['Date', 'Category', 'Subcategory', 'Amount', 'Description']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            for transaction in transactions:
                writer.writerow(transaction)

        print(f"Synced {len(transactions)} transactions to {output_path}")
        return len(transactions)

    def get_monthly_summary(self, month: str) -> Dict[str, Dict[str, float]]:
        """
        Get spending summary for a specific month

        Args:
            month: Month in YYYY-MM format

        Returns:
            Dictionary of categories with subcategory spending
        """
        transactions = self.get_transactions()

        summary = {}
        for txn in transactions:
            txn_month = txn['Date'][:7]  # Extract YYYY-MM

            if txn_month == month:
                category = txn['Category']
                subcategory = txn['Subcategory']
                amount = txn['Amount']

                if category not in summary:
                    summary[category] = {}

                if subcategory not in summary[category]:
                    summary[category][subcategory] = 0.0

                summary[category][subcategory] += amount

        return summary


def test_google_sheets_service():
    """Test function to verify Google Sheets integration"""
    print("Testing Google Sheets Service...")

    service = GoogleSheetsService()

    # Test authentication
    print("\n1. Testing authentication...")
    if service.authenticate():
        print("✓ Authentication successful")
    else:
        print("✗ Authentication failed")
        return

    # Test reading transactions
    print("\n2. Testing transaction read...")
    try:
        transactions = service.get_transactions()
        print(f"✓ Read {len(transactions)} transactions")

        if transactions:
            print("\nSample transaction:")
            print(json.dumps(transactions[0], indent=2))
    except Exception as e:
        print(f"✗ Error reading transactions: {e}")
        return

    # Test CSV sync
    print("\n3. Testing CSV sync...")
    try:
        count = service.sync_to_csv()
        print(f"✓ Synced {count} transactions to CSV")
    except Exception as e:
        print(f"✗ Error syncing to CSV: {e}")
        return

    print("\n✓ All tests passed!")


if __name__ == '__main__':
    test_google_sheets_service()

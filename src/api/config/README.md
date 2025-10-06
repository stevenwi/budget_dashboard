# Google Sheets API Configuration

This directory contains configuration files for Google Sheets integration.

## Setup Instructions

### 1. Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create Service Account Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `budget-app-sheets-reader`
   - Description: `Service account for reading budget transaction data`
4. Click "Create and Continue"
5. Grant the service account the **"Viewer"** role (or minimal required permissions)
6. Click "Continue" > "Done"

### 3. Download Credentials JSON

1. Find your newly created service account in the list
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Select **JSON** format
6. Click "Create" - the credentials file will download

### 4. Install Credentials

1. Rename the downloaded file to `google_credentials.json`
2. Place it in this directory: `src/api/config/google_credentials.json`
3. **IMPORTANT**: Never commit this file to version control (it's in .gitignore)

### 5. Configure Spreadsheet Access

1. Open your Google Spreadsheet
2. Click the "Share" button
3. Add the service account email (from the credentials JSON: `client_email`)
4. Grant **Viewer** permissions
5. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

### 6. Set Environment Variables

Create a `.env` file in `src/api/` or set environment variables:

```bash
# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_CREDENTIALS_PATH=src/api/config/google_credentials.json  # Optional, uses default if not set
```

## Spreadsheet Format

Your Google Spreadsheet should have a sheet named **"Transactions"** with the following columns:

| Column A | Column B  | Column C    | Column D | Column E    |
|----------|-----------|-------------|----------|-------------|
| Date     | Category  | Subcategory | Amount   | Description |
| 2025-01-01 | Shopping | Groceries | 150.50 | Weekly groceries |
| 2025-01-02 | Utilities | Electric | 85.00 | Monthly bill |

**Column Details:**
- **Date**: Format `YYYY-MM-DD` (e.g., `2025-01-15`)
- **Category**: One of: `Shopping`, `Utilities`, `Home`, `Earnings`
- **Subcategory**: Any subcategory name
- **Amount**: Numeric value (e.g., `100.50`)
- **Description**: Optional text description

## Testing the Integration

### Test from Python

```bash
cd src/api
python google_sheets_service.py
```

This will run the test function and verify:
1. Authentication works
2. Can read transactions from the sheet
3. Can sync to CSV file

### Test API Endpoints

Once the Flask API is running, you can test these endpoints:

```bash
# Check Google Sheets integration status
curl http://budget.local:5000/api/google-sheets/status

# Get transactions from Google Sheets
curl http://budget.local:5000/api/google-sheets/transactions

# Sync Google Sheets to local CSV
curl -X POST http://budget.local:5000/api/google-sheets/sync

# Get monthly summary
curl http://budget.local:5000/api/google-sheets/monthly-summary/2025-01
```

## Security Notes

- **NEVER** commit `google_credentials.json` to version control
- Limit service account permissions to read-only
- Only share the spreadsheet with the service account email
- Rotate credentials periodically
- Use environment variables for sensitive configuration

## Troubleshooting

### "google_credentials.json not found"
- Ensure the credentials file is in `src/api/config/google_credentials.json`
- Check the path in environment variable `GOOGLE_CREDENTIALS_PATH`

### "Permission denied" errors
- Make sure you've shared the spreadsheet with the service account email
- Verify the service account has at least "Viewer" permissions

### "Invalid authentication credentials"
- Re-download the credentials JSON from Google Cloud Console
- Ensure the JSON file is valid and not corrupted

### "Spreadsheet not found"
- Check that `GOOGLE_SHEETS_ID` environment variable is set correctly
- Verify the spreadsheet ID from the URL

## Dependencies

Install required Python packages:

```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

Or add to `requirements.txt`:
```
google-auth>=2.0.0
google-auth-oauthlib>=0.5.0
google-auth-httplib2>=0.1.0
google-api-python-client>=2.0.0
```

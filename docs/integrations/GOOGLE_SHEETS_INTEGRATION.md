# Google Sheets Integration for Budget Dashboard

This document describes the Google Sheets integration that allows the budget dashboard to pull actual spending data from Google Spreadsheets.

---

## Overview

The integration enables:
- ✅ Automatic synchronization of transactions from Google Sheets
- ✅ Real-time spending data without manual CSV uploads
- ✅ Monthly spending summaries pulled directly from spreadsheets
- ✅ Separation of budget planning (app) and transaction recording (spreadsheet)

---

## Architecture

```
┌─────────────────────┐
│  Google Sheets      │
│  (Transactions)     │
└──────────┬──────────┘
           │
           │ Google Sheets API v4
           │ (Service Account Auth)
           ▼
┌─────────────────────┐
│  Flask API          │
│  - google_sheets    │
│    _service.py      │
└──────────┬──────────┘
           │
           │ JSON/CSV
           ▼
┌─────────────────────┐
│  Budget Dashboard   │
│  (Angular + Stencil)│
└─────────────────────┘
```

---

## Setup Guide

### 1. Google Cloud Console Setup

1. **Create/Select Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing

2. **Enable Google Sheets API**
   ```
   APIs & Services → Library → Search "Google Sheets API" → Enable
   ```

3. **Create Service Account**
   ```
   APIs & Services → Credentials → Create Credentials → Service Account

   Name: budget-app-sheets-reader
   Role: Viewer (or custom minimal permissions)
   ```

4. **Download Credentials**
   - Click on the service account
   - Go to "Keys" tab
   - "Add Key" → "Create new key" → JSON format
   - Save as `google_credentials.json`

### 2. Local Configuration

1. **Install Dependencies**
   ```bash
   cd src/api
   pip install -r requirements.txt
   ```

2. **Place Credentials**
   ```bash
   # Copy downloaded credentials
   cp ~/Downloads/your-project-*.json src/api/config/google_credentials.json
   ```

3. **Set Environment Variables**

   Create `src/api/.env`:
   ```env
   GOOGLE_SHEETS_ID=your_spreadsheet_id_here
   GOOGLE_CREDENTIALS_PATH=src/api/config/google_credentials.json
   ```

   Or set in system environment:
   ```bash
   # Windows
   set GOOGLE_SHEETS_ID=your_spreadsheet_id

   # Linux/Mac
   export GOOGLE_SHEETS_ID=your_spreadsheet_id
   ```

### 3. Google Sheets Configuration

1. **Open Your Spreadsheet**
   - Create a new Google Spreadsheet or use existing

2. **Create Transactions Sheet**
   - Sheet name must be: `Transactions`
   - Format:

   | A (Date)   | B (Category) | C (Subcategory) | D (Amount) | E (Description) |
   |------------|--------------|-----------------|------------|-----------------|
   | 2025-01-01 | Shopping     | Groceries       | 150.50     | Weekly groceries|
   | 2025-01-02 | Utilities    | Electric        | 85.00      | Monthly bill    |
   | 2025-01-03 | Home         | Rent            | 1200.00    | January rent    |

3. **Share with Service Account**
   - Click "Share" button
   - Add service account email (from `google_credentials.json`: `client_email`)
   - Grant "Viewer" permissions
   - Click "Share"

4. **Get Spreadsheet ID**
   ```
   URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit

   Example:
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit

   Spreadsheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   ```

---

## Spreadsheet Format Requirements

### Column Specifications

| Column | Name        | Format        | Required | Example           |
|--------|-------------|---------------|----------|-------------------|
| A      | Date        | YYYY-MM-DD    | Yes      | 2025-01-15        |
| B      | Category    | Text          | Yes      | Shopping          |
| C      | Subcategory | Text          | Yes      | Groceries         |
| D      | Amount      | Number        | Yes      | 150.50            |
| E      | Description | Text          | No       | Weekly groceries  |

### Valid Categories

Must match one of:
- `Shopping`
- `Utilities`
- `Home`
- `Earnings`

### Data Validation Rules

- **Date**: Must be valid date in `YYYY-MM-DD` format
- **Amount**: Must be numeric (commas and $ signs are automatically stripped)
- **Empty rows**: Automatically skipped
- **Header row**: First row is treated as header and skipped

---

## API Endpoints

### Check Integration Status

```bash
GET /api/google-sheets/status
```

**Response:**
```json
{
  "configured": true,
  "authenticated": true,
  "spreadsheet_id": "1BxiMVs...",
  "message": "Google Sheets integration is active"
}
```

### Get Transactions

```bash
GET /api/google-sheets/transactions
```

**Response:**
```json
{
  "success": true,
  "count": 125,
  "transactions": [
    {
      "Date": "2025-01-01",
      "Category": "Shopping",
      "Subcategory": "Groceries",
      "Amount": 150.50,
      "Description": "Weekly groceries"
    },
    ...
  ]
}
```

### Sync to Local CSV

```bash
POST /api/google-sheets/sync
```

**Response:**
```json
{
  "success": true,
  "transactions_synced": 125,
  "message": "Successfully synced 125 transactions from Google Sheets"
}
```

**Effect**: Overwrites `src/api/data/transactions.csv` with latest data from Google Sheets

### Get Monthly Summary

```bash
GET /api/google-sheets/monthly-summary/2025-01
```

**Response:**
```json
{
  "success": true,
  "month": "2025-01",
  "summary": {
    "Shopping": {
      "Groceries": 450.50,
      "Clothing": 120.00
    },
    "Utilities": {
      "Electric": 85.00,
      "Internet": 60.00
    }
  }
}
```

---

## Testing

### Test Service Directly

```bash
cd src/api
python google_sheets_service.py
```

Expected output:
```
Testing Google Sheets Service...

1. Testing authentication...
✓ Authentication successful

2. Testing transaction read...
✓ Read 125 transactions

Sample transaction:
{
  "Date": "2025-01-01",
  "Category": "Shopping",
  "Subcategory": "Groceries",
  "Amount": 150.5,
  "Description": "Weekly groceries"
}

3. Testing CSV sync...
✓ Synced 125 transactions to CSV

✓ All tests passed!
```

### Test API Endpoints

```bash
# Start the API server
npm run start:api

# In another terminal, test endpoints:

# Check status
curl http://budget.local:5000/api/google-sheets/status

# Get transactions
curl http://budget.local:5000/api/google-sheets/transactions

# Sync to CSV
curl -X POST http://budget.local:5000/api/google-sheets/sync

# Get monthly summary
curl http://budget.local:5000/api/google-sheets/monthly-summary/2025-01
```

---

## Usage Workflow

### Option 1: Manual Sync

1. Add transactions to Google Sheets as you spend
2. When ready to update dashboard, call sync endpoint:
   ```bash
   curl -X POST http://budget.local:5000/api/google-sheets/sync
   ```
3. Reload dashboard to see updated spending

### Option 2: Automatic Background Sync

Add a scheduled job (future enhancement):

```python
# In app.py - add background task
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()
scheduler.add_job(
    func=lambda: google_sheets_service.sync_to_csv(TXN_FILE),
    trigger="interval",
    hours=1  # Sync every hour
)
scheduler.start()
```

### Option 3: Real-time (Direct Query)

Use `/api/google-sheets/transactions` endpoint instead of loading from CSV:

```python
# Modify load_transactions() in app.py to use Google Sheets directly
def load_transactions():
    if google_sheets_service:
        return google_sheets_service.get_transactions()
    # Fallback to CSV
    return load_transactions_from_csv()
```

---

## Security Best Practices

### ✅ DO

- ✅ Use service account (not OAuth user credentials)
- ✅ Grant minimum required permissions (Viewer only)
- ✅ Keep `google_credentials.json` in `.gitignore`
- ✅ Rotate service account keys periodically
- ✅ Only share spreadsheet with service account (not public)
- ✅ Use environment variables for sensitive config

### ❌ DON'T

- ❌ Commit credentials to version control
- ❌ Share credentials via email/chat
- ❌ Grant write permissions unless necessary
- ❌ Make spreadsheet publicly viewable
- ❌ Hardcode spreadsheet ID in code (use env vars)

---

## Troubleshooting

### Error: "google_credentials.json not found"

**Solution:**
```bash
# Verify file exists
ls src/api/config/google_credentials.json

# Check environment variable
echo $GOOGLE_CREDENTIALS_PATH

# Set correct path
export GOOGLE_CREDENTIALS_PATH=src/api/config/google_credentials.json
```

### Error: "Permission denied" or "Spreadsheet not found"

**Solution:**
1. Verify spreadsheet is shared with service account email
2. Check service account email in `google_credentials.json` under `client_email`
3. Re-share spreadsheet with exact email address
4. Grant at least "Viewer" permissions

### Error: "Invalid authentication credentials"

**Solution:**
1. Re-download credentials from Google Cloud Console
2. Ensure JSON file is valid (not corrupted)
3. Verify service account is still active
4. Check if Sheets API is enabled in project

### Error: "Invalid date format in row X"

**Solution:**
- Dates must be in `YYYY-MM-DD` format
- Check row X in spreadsheet
- Format cells as "Plain text" and manually enter date

### Warning: "No transactions found in Google Sheet"

**Possible causes:**
1. Sheet name is not "Transactions"
2. Spreadsheet is empty
3. Wrong spreadsheet ID
4. All rows have invalid data

**Solution:**
- Verify sheet name (case-sensitive)
- Add at least one valid transaction row
- Double-check `GOOGLE_SHEETS_ID` environment variable

---

## Code Structure

```
src/api/
├── google_sheets_service.py    # Main service implementation
├── app.py                       # Flask API with Google Sheets endpoints
├── requirements.txt             # Python dependencies
├── config/
│   ├── .gitignore              # Protect credentials
│   ├── google_credentials.example.json
│   ├── google_credentials.json  # Your actual credentials (gitignored)
│   └── README.md               # Setup instructions
└── data/
    └── transactions.csv        # Synced data (optional)
```

---

## Future Enhancements

- [ ] Automatic scheduled syncing (every hour/day)
- [ ] Write-back to Google Sheets (add transactions from app)
- [ ] Multiple spreadsheet support (different sheets per category)
- [ ] OAuth user authentication (instead of service account)
- [ ] Conflict resolution (CSV vs Sheets changes)
- [ ] Audit log of sync operations
- [ ] Webhooks for real-time updates
- [ ] Data validation in spreadsheet (Google Apps Script)

---

## Dependencies

**Python Packages:**
```
google-auth>=2.0.0
google-auth-oauthlib>=0.5.0
google-auth-httplib2>=0.1.0
google-api-python-client>=2.0.0
```

**Installation:**
```bash
pip install -r src/api/requirements.txt
```

---

## Support

**Documentation:**
- [Google Sheets API Docs](https://developers.google.com/sheets/api)
- [Service Account Setup](https://cloud.google.com/iam/docs/creating-managing-service-accounts)
- [API Reference](https://developers.google.com/sheets/api/reference/rest)

**Local Documentation:**
- `src/api/config/README.md` - Detailed setup guide
- `src/api/google_sheets_service.py` - Code documentation

---

**Last Updated:** 2025-10-05

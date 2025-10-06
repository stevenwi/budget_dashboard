# OAuth2 PKCE Setup Guide for Personal Google Drive Access

This guide shows how to set up OAuth2 with PKCE (Proof Key for Code Exchange) to allow the budget app to access your personal Google Drive and Google Sheets.

---

## Why OAuth2 Instead of Service Account?

**OAuth2 Benefits:**
- ✅ Access YOUR personal Google Drive files
- ✅ No need to share spreadsheets
- ✅ More secure for personal use
- ✅ Can browse and select from all your sheets
- ✅ Automatic token refresh

**Service Account:**
- ❌ Requires sharing each spreadsheet
- ❌ Separate Google identity
- ✅ Better for automated/server apps

---

## Setup Steps

### 1. Create OAuth2 Credentials in Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select Project**
   - Create new project or use existing one
   - Project name: `Budget Dashboard` (or any name)

3. **Enable Required APIs**
   ```
   APIs & Services → Library → Enable:
   - Google Sheets API
   - Google Drive API
   ```

4. **Configure OAuth Consent Screen**
   ```
   APIs & Services → OAuth consent screen

   User Type: External (for personal Google account)

   App Information:
   - App name: Budget Dashboard
   - User support email: your@email.com
   - Developer contact: your@email.com

   Scopes: Add the following scopes:
   - .../auth/spreadsheets.readonly
   - .../auth/drive.readonly

   Test users: Add your Google email address
   ```

5. **Create OAuth2 Client ID**
   ```
   APIs & Services → Credentials → Create Credentials → OAuth Client ID

   Application type: Web application
   Name: Budget Dashboard Web Client

   Authorized redirect URIs (add all three):
   - http://budget.local:5000/api/oauth/callback
   - http://192.168.151.108:5000/api/oauth/callback
   - http://localhost:5000/api/oauth/callback
   ```

6. **Download Client Secret JSON**
   - Click the download icon for your OAuth 2.0 Client ID
   - Save the JSON file

### 2. Install OAuth Client Secrets

1. **Rename downloaded file**
   ```bash
   mv ~/Downloads/client_secret_*.json src/api/config/oauth_client_secrets.json
   ```

2. **Verify file structure** (should match this format):
   ```json
   {
     "web": {
       "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
       "project_id": "your-project-id",
       "auth_uri": "https://accounts.google.com/o/oauth2/auth",
       "token_uri": "https://oauth2.googleapis.com/token",
       "client_secret": "YOUR_CLIENT_SECRET",
       "redirect_uris": [...]
     }
   }
   ```

3. **Security Check**
   ```bash
   # Verify file is in .gitignore
   git check-ignore src/api/config/oauth_client_secrets.json
   # Should output: src/api/config/oauth_client_secrets.json
   ```

### 3. Start the API Server

```bash
npm run start:api
```

Server should start at: `http://budget.local:5000`

---

## Usage Flow

### First-Time Login

1. **Visit Login Page**
   ```
   http://budget.local:5000/api/oauth/login
   ```

2. **Google Authorization**
   - You'll be redirected to Google
   - Sign in with your Google account
   - Review permissions:
     - "View your Google Sheets files"
     - "View files in your Google Drive"
   - Click "Allow"

3. **Redirect Back**
   - After authorization, you're redirected to:
   ```
   http://budget.local:4200/?oauth=success
   ```
   - Credentials are saved locally in:
   ```
   src/api/config/oauth_token.json
   ```

### Subsequent Use

Once authenticated, your token is saved and automatically refreshed. No need to log in again unless you:
- Manually log out
- Revoke access from Google account settings
- Delete the token file

---

## API Endpoints

### Authentication

#### Check Status
```bash
GET /api/oauth/status
```

**Response:**
```json
{
  "authenticated": true,
  "message": "User is authenticated with Google"
}
```

#### Login
```bash
GET /api/oauth/login
```
Redirects to Google authorization page.

#### Logout
```bash
POST /api/oauth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Accessing Your Spreadsheets

#### List All Spreadsheets
```bash
GET /api/oauth/spreadsheets
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "spreadsheets": [
    {
      "id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "name": "My Budget 2025",
      "modifiedTime": "2025-01-15T10:30:00.000Z",
      "webViewLink": "https://docs.google.com/spreadsheets/d/..."
    },
    ...
  ]
}
```

#### Get Transactions from Specific Sheet
```bash
GET /api/oauth/spreadsheet/{SPREADSHEET_ID}/transactions
```

**Example:**
```bash
curl http://budget.local:5000/api/oauth/spreadsheet/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/transactions
```

**Response:**
```json
{
  "success": true,
  "spreadsheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
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

---

## Testing

### 1. Test Login Flow

```bash
# Start API server
npm run start:api

# Open browser
http://budget.local:5000/api/oauth/login

# Follow Google authorization flow

# Check status
curl http://budget.local:5000/api/oauth/status
```

### 2. Test Spreadsheet Access

```bash
# List your spreadsheets
curl http://budget.local:5000/api/oauth/spreadsheets

# Get transactions (replace ID with yours)
curl http://budget.local:5000/api/oauth/spreadsheet/YOUR_SPREADSHEET_ID/transactions
```

### 3. Test Logout

```bash
curl -X POST http://budget.local:5000/api/oauth/logout
```

---

## Spreadsheet Format

Your Google Sheets must have a sheet named **"Transactions"** with this format:

| A (Date)   | B (Category) | C (Subcategory) | D (Amount) | E (Description) |
|------------|--------------|-----------------|------------|-----------------|
| 2025-01-01 | Shopping     | Groceries       | 150.50     | Weekly groceries|
| 2025-01-02 | Utilities    | Electric        | 85.00      | Monthly bill    |
| 2025-01-03 | Home         | Rent            | 1200.00    | January rent    |

**Valid Categories:**
- `Shopping`
- `Utilities`
- `Home`
- `Earnings`

---

## Security Notes

### ✅ DO

- ✅ Keep `oauth_client_secrets.json` secret
- ✅ Never commit credentials to Git
- ✅ Use HTTPS in production
- ✅ Set a strong `FLASK_SECRET_KEY` environment variable
- ✅ Limit OAuth scopes to readonly
- ✅ Add only trusted test users in OAuth consent screen

### ❌ DON'T

- ❌ Share client secrets publicly
- ❌ Commit `oauth_token.json` to version control
- ❌ Use `0.0.0.0` as host in production
- ❌ Skip CSRF protection (state parameter)
- ❌ Grant write permissions unless needed

---

## Troubleshooting

### Error: "oauth_client_secrets.json not found"

**Solution:**
```bash
# Check file exists
ls src/api/config/oauth_client_secrets.json

# If not, download from Google Cloud Console
# "APIs & Services" → "Credentials" → Download icon
```

### Error: "redirect_uri_mismatch"

**Cause:** The redirect URI in your request doesn't match the ones configured in Google Cloud Console.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add all redirect URIs:
   ```
   http://budget.local:5000/api/oauth/callback
   http://192.168.151.108:5000/api/oauth/callback
   http://localhost:5000/api/oauth/callback
   ```

### Error: "Access blocked: Budget Dashboard has not completed the Google verification process"

**Cause:** App is not verified (normal for personal use).

**Solution:**
1. Click "Advanced"
2. Click "Go to Budget Dashboard (unsafe)"
3. This is safe for your own personal app

**Or:** Add your email as a test user in OAuth consent screen.

### Error: "Invalid state parameter"

**Cause:** Session expired or CSRF attack.

**Solution:**
1. Clear browser cookies
2. Restart login flow
3. Don't open multiple login tabs

### Token Expired / Invalid Credentials

**Solution:**
```bash
# Delete saved token
rm src/api/config/oauth_token.json

# Login again
http://budget.local:5000/api/oauth/login
```

---

## Comparison: Service Account vs OAuth2

| Feature | Service Account | OAuth2 (PKCE) |
|---------|----------------|---------------|
| Access personal Drive | ❌ (need to share) | ✅ Direct access |
| Setup complexity | Medium | Medium |
| User login required | No | Yes (once) |
| Token refresh | N/A | Automatic |
| Best for | Automation | Personal use |
| Credentials storage | Service account JSON | OAuth client secrets + tokens |

---

## Environment Variables

**Optional:** Set these for production:

```bash
# .env file or environment
FLASK_SECRET_KEY=your-secret-key-here-minimum-32-characters
GOOGLE_OAUTH_CLIENT_SECRETS=src/api/config/oauth_client_secrets.json
```

**Generate secure secret key:**
```python
import secrets
print(secrets.token_hex(32))
```

---

## Integration with Angular App

### Example: Login Button

```typescript
// component.ts
loginWithGoogle() {
  window.location.href = 'http://budget.local:5000/api/oauth/login';
}

// Check status on init
ngOnInit() {
  this.http.get('http://budget.local:5000/api/oauth/status')
    .subscribe(status => {
      this.isAuthenticated = status.authenticated;
    });
}
```

### Example: List Spreadsheets

```typescript
listSpreadsheets() {
  this.http.get('http://budget.local:5000/api/oauth/spreadsheets')
    .subscribe(response => {
      this.spreadsheets = response.spreadsheets;
    });
}
```

---

## Next Steps

1. ✅ Complete Google Cloud Console setup
2. ✅ Download and install OAuth client secrets
3. ✅ Test login flow
4. ✅ Access your spreadsheets
5. 🔄 Integrate with Angular UI (future enhancement)

---

**Last Updated:** 2025-10-05
**Documentation:** See also `GOOGLE_SHEETS_INTEGRATION.md` for service account setup

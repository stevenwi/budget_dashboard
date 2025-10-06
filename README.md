# Budget Dashboard

A modern budget management application built with Angular 20, Stencil.js web components, and Flask API backend.

## Features

- 📊 **Budget Planning** - Create and manage monthly budgets across multiple categories
- 💰 **Transaction Tracking** - Track spending against budgets
- 📈 **Trends Analysis** - Visualize spending patterns over time
- 🔄 **Recurring Presets** - Save common budget templates
- ☁️ **Google Drive Integration** - Sync transactions from Google Sheets
- 🔐 **OAuth2 Authentication** - Secure access to your personal Google Drive

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Python 3.8+
- npm or yarn

### Installation

```bash
# Install Angular dependencies
npm install

# Install Flask API dependencies
pip install -r src/api/requirements.txt

# Build Stencil components
cd poc && npm run build && cd ..
```

### Running the Application

```bash
# Start the Angular app (in one terminal)
npm start

# Start the Flask API (in another terminal)
npm run start:api
```

The app will be available at:
- **Angular App:** http://budget.local:4200 or http://192.168.151.108:4200
- **Flask API:** http://budget.local:5000 or http://192.168.151.108:5000

## Architecture

**Frontend:**
- Angular 20 - Main application framework
- Stencil.js - Reusable web components
- Materialize CSS - UI styling

**Backend:**
- Flask - REST API server
- Python - Business logic
- JSON - Data storage

**Integrations:**
- Google Sheets API - Transaction data sync
- Google Drive API - File access

## Project Structure

```
budget_dashboard/
├── src/
│   ├── app/                    # Angular application
│   │   ├── components/         # Angular components
│   │   └── services/           # Angular services
│   └── api/                    # Flask API backend
│       ├── app.py             # Main Flask application
│       ├── google_sheets_service.py
│       ├── google_oauth_service.py
│       └── config/            # API configuration & credentials
├── poc/                       # Stencil components library
│   └── src/components/        # Reusable web components
├── docs/                      # Documentation
│   ├── integrations/          # Integration guides
│   └── UI_ARCHITECTURE_CODE_REVIEW.md
├── deprecated/                # Original micro-frontend files
└── package.json
```

## Development Commands

### Angular App

```bash
npm start              # Start dev server
npm test              # Run tests
ng build              # Build for production
```

### Flask API

```bash
npm run start:api     # Start API server
python src/api/app.py # Alternative start method
```

### Stencil Components

```bash
cd poc
npm run build         # Build components
npm start             # Dev server with hot reload
```

## Documentation

### Integration Guides

- **[Google Sheets Integration](docs/integrations/GOOGLE_SHEETS_INTEGRATION.md)** - Set up service account for automated sheet access
- **[OAuth2 Setup Guide](docs/integrations/OAUTH2_SETUP_GUIDE.md)** - Configure OAuth2 PKCE for personal Google Drive access

### Architecture

- **[UI Architecture Review](docs/UI_ARCHITECTURE_CODE_REVIEW.md)** - Code review findings and industry standards compliance
- **[Claude Instructions](CLAUDE.md)** - Development guidelines for Claude Code

## Google Sheets Integration

The app supports two methods for accessing Google Sheets transaction data:

### Option 1: Service Account (Automated)
- Best for: Automated syncing, server deployments
- Setup: See [Google Sheets Integration Guide](docs/integrations/GOOGLE_SHEETS_INTEGRATION.md)

### Option 2: OAuth2 (Personal)
- Best for: Personal use, accessing your own Drive
- Setup: See [OAuth2 Setup Guide](docs/integrations/OAUTH2_SETUP_GUIDE.md)

**Spreadsheet Format Required:**

| Date       | Category  | Subcategory | Amount | Description      |
|------------|-----------|-------------|--------|------------------|
| 2025-01-01 | Shopping  | Groceries   | 150.50 | Weekly groceries |
| 2025-01-02 | Utilities | Electric    | 85.00  | Monthly bill     |

## API Endpoints

### Budget Management
- `GET /api/months` - List all budget months
- `GET /api/view_budget/<month>` - View budget details
- `POST /api/edit_budget/<month>` - Create/update budget

### Google Sheets (Service Account)
- `GET /api/google-sheets/status` - Check integration status
- `POST /api/google-sheets/sync` - Sync transactions to CSV
- `GET /api/google-sheets/transactions` - Get all transactions
- `GET /api/google-sheets/monthly-summary/<month>` - Monthly summary

### OAuth2 (Personal Drive)
- `GET /api/oauth/login` - Initiate OAuth login
- `GET /api/oauth/status` - Check authentication status
- `GET /api/oauth/spreadsheets` - List user's spreadsheets
- `GET /api/oauth/spreadsheet/<id>/transactions` - Get transactions
- `POST /api/oauth/logout` - Clear credentials

### Presets
- `GET /api/presets` - List recurring presets
- `POST /api/presets/add` - Add new preset
- `POST /api/presets/remove` - Remove preset

## Configuration

### Environment Variables

Create `.env` file in `src/api/`:

```env
# Flask Configuration
FLASK_SECRET_KEY=your-secret-key-here

# Google Sheets (Service Account)
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_CREDENTIALS_PATH=src/api/config/google_credentials.json

# OAuth2 (Personal Drive)
GOOGLE_OAUTH_CLIENT_SECRETS=src/api/config/oauth_client_secrets.json
```

### Network Configuration

The app is configured to run on your local network:
- Host: `192.168.151.108` or `budget.local`
- Angular Port: `4200`
- API Port: `5000`

Update `angular.json` and `src/api/app.py` to change network settings.

## Testing

### Angular Tests
```bash
npm test
```

### API Tests
```bash
# Test Google Sheets service
cd src/api
python google_sheets_service.py

# Test OAuth service
python google_oauth_service.py
```

### Manual API Testing
```bash
# Check Google Sheets status
curl http://budget.local:5000/api/google-sheets/status

# Check OAuth status
curl http://budget.local:5000/api/oauth/status

# List spreadsheets (requires OAuth login)
curl http://budget.local:5000/api/oauth/spreadsheets
```

## Security Notes

⚠️ **Important Security Practices:**

- ✅ Never commit credentials to version control
- ✅ Use `.gitignore` to protect sensitive files
- ✅ Rotate API keys and secrets periodically
- ✅ Use HTTPS in production
- ✅ Set strong `FLASK_SECRET_KEY`
- ✅ Limit OAuth scopes to minimum required

**Protected Files:**
- `src/api/config/google_credentials.json`
- `src/api/config/oauth_client_secrets.json`
- `src/api/config/oauth_token.json`

## Troubleshooting

### Connection Refused
- Verify servers are running on correct ports
- Check firewall settings
- Ensure `budget.local` DNS is configured

### Google Sheets Not Loading
- Verify credentials are properly configured
- Check API is enabled in Google Cloud Console
- Ensure spreadsheet is shared with service account OR user is authenticated via OAuth

### Build Errors
```bash
# Clear caches and rebuild
rm -rf .angular dist node_modules/budget-components
cd poc && npm run build && cd ..
npm install
npm start
```

## Contributing

1. Create a feature branch
2. Make changes
3. Update documentation
4. Test thoroughly
5. Submit pull request

## License

This project is for personal/educational use.

## Additional Resources

- [Angular Documentation](https://angular.dev)
- [Stencil.js Documentation](https://stenciljs.com)
- [Flask Documentation](https://flask.palletsprojects.com)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Material Design](https://material.io)

---

**Last Updated:** 2025-10-05

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
python app.py
```
- Starts Flask development server on localhost:5000
- Debug mode is enabled by default
- Creates `data/` directory and `budgets.json` if they don't exist

### Dependencies
```bash
pip install -r requirements.txt
```
- Install Flask==2.3.2 and python-dotenv==1.0.0

### Testing
No formal test framework is configured. Test by running the application and using the web interface.

## Architecture Overview

This is a **micro frontend budget dashboard** built with Flask backend and vanilla JavaScript web components frontend. The application follows the micro frontend pattern described in `micro-frontend-architecture.md`.

### Core Architecture Components

#### Backend (Flask)
- **`app.py`** - Main Flask application with API endpoints and traditional routes
- **`budget_app.py`** - Core budget management logic (BudgetManager, TransactionManager, Analyzer classes)
- **`recurringmanager.py`** - Manages recurring budget presets

#### Frontend (Micro Frontend Shell)
- **`static/micro-frontend-shell.html`** - Main shell application that loads and orchestrates micro frontends
- **`static/js/shell.js`** - Navigation logic and micro frontend routing
- **`static/bundles/*.js`** - Individual micro frontend components as web components:
  - `dashboard-home.js` - Main dashboard view
  - `budgets-list.js` - List of budget months
  - `edit-budget.js` - Budget editing interface
  - `view-budget.js` - Budget viewing with spending comparisons
  - `trends-view.js` - Spending trends visualization
  - `presets-manager.js` - Recurring preset management
  - `transactions-table.js` - Transaction display
  - `recurring-manager.js` - Recurring budget management

#### Data Layer
- **`data/budgets.json`** - Monthly budget data storage
- **`data/recurring.json`** - Recurring budget preset templates
- **`data/transactions.csv`** - Transaction data for analysis

### Key Architectural Patterns

#### Micro Frontend Implementation
The application uses **runtime integration via web components**:
- Each micro frontend is packaged as a JavaScript bundle that defines a custom element
- The shell application (`micro-frontend-shell.html`) loads all bundles and routes between them
- Navigation is handled by `shell.js` which creates/destroys web components based on route
- Each component is self-contained with its own logic and communicates via DOM events

#### Data Flow
1. **Budget Management**: BudgetManager handles CRUD operations for monthly budgets
2. **Preset System**: RecurringManager provides templates for new month budgets
3. **Transaction Analysis**: TransactionManager loads CSV data for spending comparisons
4. **API Layer**: Flask provides both REST endpoints (`/api/*`) and traditional HTML routes

#### Budget Categories
The system uses four fixed categories:
- **Shopping** - General purchases
- **Utilities** - Bills and services
- **Home** - Housing-related expenses
- **Earnings** - Income tracking

### Development Patterns

#### Adding New Micro Frontends
1. Create new JavaScript bundle in `static/bundles/`
2. Define custom element that extends HTMLElement
3. Add script tag to `micro-frontend-shell.html`
4. Register route in `shell.js` microFrontends mapping
5. Add navigation logic if needed

#### API Endpoints
- Use `/api/*` routes for JSON responses to web components
- Traditional routes (`/edit/*`, `/view/*`) serve HTML templates
- Both patterns coexist for flexibility

#### State Management
- No global state management framework
- Each web component manages its own state
- Communication between components via DOM events
- Backend state persisted to JSON files

### File Organization
```
├── app.py                    # Main Flask application
├── budget_app.py             # Core business logic
├── recurringmanager.py       # Preset management
├── data/                     # JSON/CSV data storage
├── static/
│   ├── micro-frontend-shell.html  # Main shell app
│   ├── js/shell.js          # Navigation & routing
│   ├── bundles/             # Micro frontend components
│   └── css/                 # Shared styles
└── templates/               # Traditional Jinja templates
```

### Cache Management
Development mode includes aggressive cache-busting headers to ensure updated JavaScript bundles are loaded immediately during development.
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Angular Application
```bash
npm start
```
- Starts Angular development server on localhost:4200
- Hot reload enabled for development

### Running the API Backend
```bash
npm run start:api
```
- Starts Flask API server on localhost:5000
- Provides API endpoints for the Angular/Stencil components
- Creates `src/api/data/` directory and `budgets.json` if they don't exist

### Building Stencil Components
```bash
cd poc && npm run build
```
- Builds the Stencil web components library
- Required before running Angular app if components are modified

### Dependencies
```bash
npm install                           # Install Angular dependencies
pip install -r src/api/requirements.txt  # Install Flask API dependencies
```

### Testing
- Angular: `npm test`
- No formal test framework configured for API. Test by running both servers and using the web interface.

## Architecture Overview

This is an **Angular budget dashboard** that integrates with Stencil web components and a Flask API backend. The application has been reorganized from the original micro-frontend pattern to a proper Angular application structure.

### Core Architecture Components

#### Frontend (Angular + Stencil)
- **`src/app/`** - Angular application components
- **`src/main.ts`** - Angular bootstrap file
- **`src/index.html`** - Main HTML entry point
- **`poc/src/components/`** - Stencil web components:
  - `dashboard-home.tsx` - Main dashboard view
  - Other reusable components for budget management

#### Backend (Flask API)
- **`src/api/app.py`** - Main Flask application with API endpoints
- **`src/api/budget_app.py`** - Core budget management logic (BudgetManager, TransactionManager, Analyzer classes)
- **`src/api/recurringmanager.py`** - Manages recurring budget presets

#### Data Layer
- **`src/api/data/budgets.json`** - Monthly budget data storage
- **`src/api/data/recurring.json`** - Recurring budget preset templates
- **`src/api/data/transactions.csv`** - Transaction data for analysis

#### Legacy/Reference
- **`deprecated/`** - Original micro-frontend implementation files for reference

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
├── src/                      # Main source directory
│   ├── app/                  # Angular application
│   ├── api/                  # Flask API backend
│   │   ├── app.py           # Main Flask application
│   │   ├── budget_app.py    # Core business logic
│   │   ├── recurringmanager.py # Preset management
│   │   └── data/            # JSON/CSV data storage
│   ├── index.html           # Angular main HTML
│   ├── main.ts              # Angular bootstrap
│   └── styles.css           # Global styles
├── poc/                     # Stencil components library
│   └── src/components/      # Reusable web components
├── deprecated/              # Original micro-frontend files
├── package.json             # Angular dependencies & scripts
├── angular.json             # Angular CLI configuration
└── tsconfig.*.json          # TypeScript configurations
```

### Cache Management
Development mode includes aggressive cache-busting headers to ensure updated JavaScript bundles are loaded immediately during development.
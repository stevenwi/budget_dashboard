# API endpoints for web components (edit/view budget)
from flask import make_response, session

import os, json, csv, logging
from datetime import datetime
from collections import defaultdict
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_from_directory
from budget_app import BudgetManager
from recurringmanager import RecurringManager
from google_sheets_service import GoogleSheetsService
from google_oauth_service import GoogleOAuthService

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
BUDGET_FILE = os.path.join(DATA_DIR, 'budgets.json')
TXN_FILE    = os.path.join(DATA_DIR, 'transactions.csv')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

app = Flask(__name__, static_folder='static')

# Configure session for OAuth state
app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24).hex())

# Configure logging to show request details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Enable Flask's request logging
@app.before_request
def log_request_info():
    app.logger.info('Request: %s %s', request.method, request.url)

@app.after_request
def log_response_info(response):
    app.logger.info('Response: %s %s', response.status_code, request.url)
    return response

# Add cache-busting headers and CORS for development
@app.after_request
def add_header(response):
    response.cache_control.no_cache = True
    response.cache_control.no_store = True
    response.cache_control.must_revalidate = True
    response.cache_control.max_age = 0
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'

    # Add CORS headers for development (StencilJS and Angular)
    origin = request.headers.get('Origin')
    allowed_origins = [
        'http://localhost:3333',
        'http://localhost:4200',
        'http://budget.local:4200',
        'http://192.168.151.108:4200'
    ]

    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin

    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Credentials'] = 'true'

    return response

# Initialize managers
recurring_manager = RecurringManager(os.path.join(DATA_DIR, 'recurring.json'))
budget_manager = BudgetManager(BUDGET_FILE, recurring_manager)

# Initialize Google Sheets service (optional - only if credentials are configured)
google_sheets_service = None
try:
    google_sheets_service = GoogleSheetsService()
    if google_sheets_service.authenticate():
        app.logger.info("Google Sheets service initialized successfully")
except Exception as e:
    app.logger.warning(f"Google Sheets service not available: {e}")

# Initialize OAuth service
google_oauth_service = GoogleOAuthService()

def load_transactions():
    txns = []
    if not os.path.exists(TXN_FILE):
        return txns
    with open(TXN_FILE, newline='') as f:
        reader = csv.DictReader(f)
        for r in reader:
            dt = datetime.strptime(r['Date'], '%Y-%m-%d')
            txns.append({
                'month': dt.strftime('%Y-%m'),
                'category': r['Category'],
                'sub': r['Subcategory'],
                'amount': float(r['Amount'])
            })
    return txns


@app.route('/')
def micro_frontend_shell():
    return send_from_directory('static', 'micro-frontend-shell.html')

@app.route('/api/months')
def months():
    # Get month summaries with budget and spending totals
    months = budget_manager.get_months()
    txns = load_transactions()
    month_summaries = []
    for m in months:
        budget = budget_manager.get_budget(m)
        budget_total = sum(v for subs in budget.values() for v in subs.values())
        spent_total = sum(t['amount'] for t in txns if t['month'] == m)
        # Compute earnings (sum of 'Earnings' category transactions)
        earnings_total = sum(t['amount'] for t in txns if t['month'] == m and t['category'] == 'Earnings')
        diff = spent_total - budget_total
        status = 'under' if spent_total <= budget_total else 'over'
        month_summaries.append({
            'month': m,
            'budget_total': budget_total,
            'spent_total': spent_total,
            'earnings': earnings_total,
            'diff': diff,
            'status': status
        })
    # Sort in descending order (newest first)
    month_summaries.sort(key=lambda x: x['month'], reverse=True)
    return jsonify(month_summaries)


@app.route('/api/edit_budget/<month>', methods=['GET', 'POST'])
def api_edit_budget(month):
    if request.method == 'POST':
        # Handle JSON data from Angular
        if request.is_json:
            new_budget = request.get_json()
            budget_manager.set_budget(month, new_budget)
            return make_response(jsonify({'success': True}), 200)
        # Handle form data (legacy)
        else:
            form = request.form
            new_budget = {'Shopping':{}, 'Utilities':{}, 'Home':{}, 'Earnings':{}}
            for key, val in form.items():
                if key.count('__') != 1:
                    # Skip malformed keys
                    continue
                cat, sub = key.split('__')
                if val.strip():
                    new_budget.setdefault(cat, {})[sub] = float(val)
            budget_manager.set_budget(month, new_budget)
            return make_response(jsonify({'success': True}), 200)
    # GET: return current budget
    budget = budget_manager.ensure_month_budget(month)
    return jsonify({'month': month, 'budget': budget})


@app.route('/edit/<month>', methods=['GET','POST'])
def edit_budget(month):
    # Ensure month has a budget (with presets if new)
    budget = budget_manager.ensure_month_budget(month)

    if request.method == 'POST':
        form = request.form
        new_budget = {'Shopping':{}, 'Utilities':{}, 'Home':{}, 'Earnings':{}}
        for key, val in form.items():
            # expect keys like "Shopping__Kids"
            cat, sub = key.split('__')
            if val.strip():
                new_budget.setdefault(cat, {})[sub] = float(val)
        budget_manager.set_budget(month, new_budget)
        return redirect(url_for('index'))

    return render_template('edit_budget.html',
                           month=month,
                           budget=budget)

@app.route('/view/<month>')
def view_budget(month):
    # Load budget and transactions
    budget = budget_manager.get_budget(month)
    txns = load_transactions()
    # Calculate spent per category/sub
    spent = defaultdict(lambda: defaultdict(float))
    total_spent = 0.0
    for t in txns:
        if t['month'] == month:
            spent[t['category']][t['sub']] += t['amount']
            total_spent += t['amount']
    # Calculate total budget
    total_budget = sum(v for subs in budget.values() for v in subs.values())
    total_diff = total_budget - total_spent
    return render_template('view_budget.html',
                           month=month,
                           budget=budget,
                           spent=spent,
                           total_budget=total_budget,
                           total_spent=total_spent,
                           total_diff=total_diff)

@app.route('/trends')
def trends():
    months = sorted({t['month'] for t in load_transactions()})
    cats   = ['Shopping','Utilities','Home','Earnings']  # include earnings category
    data = {cat: [] for cat in cats}

    txns = load_transactions()
    for m in months:
        monthly = defaultdict(float)
        for t in txns:
            if t['month'] == m:
                monthly[t['category']] += t['amount']
        for cat in cats:
            data[cat].append(monthly.get(cat, 0.0))

    return render_template('trends.html',
                           months=months,
                           data=json.dumps(data))

@app.route('/presets')
def manage_presets():
    """Display and manage recurring budget presets"""
    presets = recurring_manager.list_presets()
    return render_template('presets.html', presets=presets)

@app.route('/presets/add', methods=['POST'])
def add_preset():
    """Add a new recurring preset"""
    category = request.form.get('category')
    subcategory = request.form.get('subcategory')
    amount = request.form.get('amount')
    
    if category and subcategory and amount:
        try:
            recurring_manager.add_preset(category, subcategory, float(amount))
        except ValueError:
            pass  # Invalid amount, ignore
    

    return redirect(url_for('manage_presets'))

# API endpoint for view budget (JSON for web component)
@app.route('/api/view_budget/<month>')
def api_view_budget(month):
    budget = budget_manager.get_budget(month)
    txns = load_transactions()
    spent = defaultdict(lambda: defaultdict(float))
    total_spent = 0.0
    for t in txns:
        if t['month'] == month:
            spent[t['category']][t['sub']] += t['amount']
            total_spent += t['amount']
    total_budget = sum(v for subs in budget.values() for v in subs.values())
    total_diff = total_budget - total_spent
    return jsonify({
        'month': month,
        'budget': budget,
        'spent': spent,
        'total_budget': total_budget,
        'total_spent': total_spent,
        'total_diff': total_diff
    })

@app.route('/presets/remove', methods=['POST'])
def remove_preset():
    """Remove a recurring preset"""
    category = request.form.get('category')
    subcategory = request.form.get('subcategory')
    
    if category and subcategory:
        recurring_manager.remove_preset(category, subcategory)
    
    return redirect(url_for('manage_presets'))

# API endpoints for micro-frontend components
@app.route('/api/trends')
def api_trends():
    """Get trends data for chart visualization"""
    months = sorted({t['month'] for t in load_transactions()})
    cats = ['Shopping','Utilities','Home','Earnings']
    data = {cat: [] for cat in cats}

    txns = load_transactions()
    for m in months:
        monthly = defaultdict(float)
        for t in txns:
            if t['month'] == m:
                monthly[t['category']] += t['amount']
        for cat in cats:
            data[cat].append(monthly.get(cat, 0.0))

    return jsonify({
        'months': months,
        'data': data
    })

@app.route('/api/presets')
def api_presets():
    """Get current presets for management interface"""
    presets = recurring_manager.list_presets()
    return jsonify({'presets': presets})

@app.route('/api/presets/add', methods=['POST'])
def api_add_preset():
    """Add a new recurring preset via API"""
    data = request.get_json()
    category = data.get('category')
    subcategory = data.get('subcategory')
    amount = data.get('amount')
    
    if category and subcategory and amount:
        try:
            recurring_manager.add_preset(category, subcategory, float(amount))
            return jsonify({'success': True})
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid amount'})
    
    return jsonify({'success': False, 'error': 'Missing required fields'})

@app.route('/api/presets/remove', methods=['POST'])
def api_remove_preset():
    """Remove a recurring preset via API"""
    data = request.get_json()
    category = data.get('category')
    subcategory = data.get('subcategory')

    if category and subcategory:
        recurring_manager.remove_preset(category, subcategory)
        return jsonify({'success': True})

    return jsonify({'success': False, 'error': 'Missing required fields'})

# Google Sheets Integration Endpoints
@app.route('/api/google-sheets/sync', methods=['POST'])
def sync_google_sheets():
    """
    Sync transactions from Google Sheets to local CSV

    Returns:
        JSON with sync status and count of transactions synced
    """
    if not google_sheets_service:
        return jsonify({
            'success': False,
            'error': 'Google Sheets service not configured. Please add credentials.'
        }), 503

    try:
        count = google_sheets_service.sync_to_csv(TXN_FILE)
        return jsonify({
            'success': True,
            'transactions_synced': count,
            'message': f'Successfully synced {count} transactions from Google Sheets'
        })
    except Exception as e:
        app.logger.error(f"Error syncing Google Sheets: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/google-sheets/transactions')
def get_google_sheets_transactions():
    """
    Get transactions directly from Google Sheets (without saving to CSV)

    Returns:
        JSON array of transactions
    """
    if not google_sheets_service:
        return jsonify({
            'success': False,
            'error': 'Google Sheets service not configured'
        }), 503

    try:
        transactions = google_sheets_service.get_transactions()
        return jsonify({
            'success': True,
            'transactions': transactions,
            'count': len(transactions)
        })
    except Exception as e:
        app.logger.error(f"Error fetching Google Sheets data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/google-sheets/monthly-summary/<month>')
def get_google_sheets_monthly_summary(month):
    """
    Get monthly spending summary from Google Sheets

    Args:
        month: Month in YYYY-MM format

    Returns:
        JSON with spending summary by category
    """
    if not google_sheets_service:
        return jsonify({
            'success': False,
            'error': 'Google Sheets service not configured'
        }), 503

    try:
        summary = google_sheets_service.get_monthly_summary(month)
        return jsonify({
            'success': True,
            'month': month,
            'summary': summary
        })
    except Exception as e:
        app.logger.error(f"Error fetching monthly summary: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/google-sheets/status')
def google_sheets_status():
    """
    Check Google Sheets integration status

    Returns:
        JSON with status information
    """
    if not google_sheets_service:
        return jsonify({
            'configured': False,
            'authenticated': False,
            'message': 'Google Sheets service not configured. Add credentials to enable.'
        })

    try:
        # Check if we can authenticate (already done on startup, but verify)
        is_authenticated = google_sheets_service.service is not None

        spreadsheet_id = google_sheets_service.spreadsheet_id or 'Not configured'

        return jsonify({
            'configured': True,
            'authenticated': is_authenticated,
            'spreadsheet_id': spreadsheet_id,
            'message': 'Google Sheets integration is active' if is_authenticated else 'Authentication failed'
        })
    except Exception as e:
        return jsonify({
            'configured': True,
            'authenticated': False,
            'error': str(e)
        })

# OAuth2 Endpoints for Personal Google Account
@app.route('/api/oauth/login')
def oauth_login():
    """
    Initiate OAuth2 login flow

    Redirects user to Google authorization page
    """
    try:
        redirect_uri = f"http://{request.host}/api/oauth/callback"

        auth_url, state, code_verifier = google_oauth_service.get_authorization_url(redirect_uri)

        # Store state and code_verifier in session for verification
        session['oauth_state'] = state
        session['code_verifier'] = code_verifier

        return redirect(auth_url)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/oauth/callback')
def oauth_callback():
    """
    OAuth2 callback endpoint

    Handles the redirect from Google after user authorization
    """
    try:
        # Verify state to prevent CSRF
        state = request.args.get('state')
        if state != session.get('oauth_state'):
            return jsonify({'error': 'Invalid state parameter'}), 400

        # Get authorization code
        code = request.args.get('code')
        if not code:
            error = request.args.get('error')
            return jsonify({'error': f'Authorization failed: {error}'}), 400

        # Exchange code for tokens
        code_verifier = session.get('code_verifier')
        redirect_uri = f"http://{request.host}/api/oauth/callback"

        credentials = google_oauth_service.exchange_code_for_token(
            code=code,
            code_verifier=code_verifier,
            redirect_uri=redirect_uri
        )

        # Clear session data
        session.pop('oauth_state', None)
        session.pop('code_verifier', None)

        # Redirect to success page or dashboard
        return redirect('http://budget.local:4200/?oauth=success')

    except Exception as e:
        app.logger.error(f"OAuth callback error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/oauth/status')
def oauth_status():
    """
    Check OAuth authentication status

    Returns:
        JSON with authentication status
    """
    is_authenticated = google_oauth_service.is_authenticated()

    return jsonify({
        'authenticated': is_authenticated,
        'message': 'User is authenticated with Google' if is_authenticated else 'Not authenticated'
    })

@app.route('/api/oauth/logout', methods=['POST'])
def oauth_logout():
    """
    Logout and clear saved credentials

    Returns:
        JSON with logout status
    """
    try:
        google_oauth_service.logout()
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/oauth/spreadsheets')
def oauth_list_spreadsheets():
    """
    List all Google Sheets in user's Drive

    Requires OAuth authentication

    Returns:
        JSON with list of spreadsheets
    """
    if not google_oauth_service.is_authenticated():
        return jsonify({
            'error': 'Not authenticated. Please login first.',
            'login_url': '/api/oauth/login'
        }), 401

    try:
        spreadsheets = google_oauth_service.list_spreadsheets()

        return jsonify({
            'success': True,
            'count': len(spreadsheets),
            'spreadsheets': spreadsheets
        })

    except Exception as e:
        app.logger.error(f"Error listing spreadsheets: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/oauth/spreadsheet/<spreadsheet_id>/transactions')
def oauth_get_transactions(spreadsheet_id):
    """
    Get transactions from a specific spreadsheet (OAuth)

    Args:
        spreadsheet_id: The Google Sheets ID

    Returns:
        JSON with transactions
    """
    if not google_oauth_service.is_authenticated():
        return jsonify({
            'error': 'Not authenticated. Please login first.',
            'login_url': '/api/oauth/login'
        }), 401

    try:
        transactions = google_oauth_service.get_transactions(spreadsheet_id)

        return jsonify({
            'success': True,
            'spreadsheet_id': spreadsheet_id,
            'count': len(transactions),
            'transactions': transactions
        })

    except Exception as e:
        app.logger.error(f"Error getting transactions: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    os.makedirs(DATA_DIR, exist_ok=True)
    # ensure budgets.json exists
    if not os.path.exists(BUDGET_FILE):
        with open(BUDGET_FILE,'w') as f: json.dump({},f)
    # Bind to local network only (not 0.0.0.0 for security)
    app.run(debug=True, host='192.168.151.108')
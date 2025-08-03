# API endpoints for web components (edit/view budget)
from flask import make_response

import os, json, csv
from datetime import datetime
from collections import defaultdict
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_from_directory
from budget_app import BudgetManager
from recurringmanager import RecurringManager

DATA_DIR = 'data'
BUDGET_FILE = os.path.join(DATA_DIR, 'budgets.json')
TXN_FILE    = os.path.join(DATA_DIR, 'transactions.csv')

app = Flask(__name__)

# Initialize managers
recurring_manager = RecurringManager(os.path.join(DATA_DIR, 'recurring.json'))
budget_manager = BudgetManager(BUDGET_FILE, recurring_manager)

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
    return send_from_directory(os.getcwd(), 'micro-frontend-shell.html')

# Serve bundles directory for web components
@app.route('/bundles/<path:filename>')
def bundles(filename):
    return send_from_directory(os.path.join(os.getcwd(), 'bundles'), filename)

# Serve css directory for stylesheets
@app.route('/css/<path:filename>')
def css(filename):
    return send_from_directory(os.path.join(os.getcwd(), 'css'), filename)

# Serve js directory for JavaScript files
@app.route('/js/<path:filename>')
def js(filename):
    return send_from_directory(os.path.join(os.getcwd(), 'js'), filename)

@app.route('/api/months')
def months():
    # Get month summaries with budget and spending totals
    months = budget_manager.get_months()  # now ascending order
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
    return jsonify(month_summaries)


@app.route('/api/edit_budget/<month>', methods=['GET', 'POST'])
def api_edit_budget(month):
    if request.method == 'POST':
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

if __name__ == '__main__':
    os.makedirs(DATA_DIR, exist_ok=True)
    # ensure budgets.json exists
    if not os.path.exists(BUDGET_FILE):
        with open(BUDGET_FILE,'w') as f: json.dump({},f)
    app.run(debug=True)
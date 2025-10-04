import csv
import json
import os
from datetime import datetime
from collections import defaultdict

from recurringmanager import RecurringManager

BUDGET_FILE = 'budgets.json'

class Transaction:
    def __init__(self, date, category, subcategory, amount, description):
        self.date = datetime.strptime(date, '%Y-%m-%d')
        self.category = category
        self.subcategory = subcategory
        self.amount = float(amount)
        self.description = description

class BudgetManager:
    def __init__(self, filepath=BUDGET_FILE, recurring_mgr=None):
        self.filepath = filepath
        self.budgets = self.load_budgets()
        self.recurring = recurring_mgr

    def load_budgets(self):
        if not os.path.exists(self.filepath):
            return {}
        with open(self.filepath, 'r') as f:
            return json.load(f)

    def save_budgets(self):
        with open(self.filepath, 'w') as f:
            json.dump(self.budgets, f, indent=4)

    def get_budget(self, month):
        """Get budget for a specific month"""
        return self.budgets.get(month, {})

    def set_budget(self, month, budget_data):
        """Set budget for a specific month"""
        self.budgets[month] = budget_data
        self.save_budgets()

    def get_months(self):
        """Get all months with budgets (ascending)"""
        return sorted(self.budgets.keys())

    def ensure_month_budget(self, month):
        """Ensure a month has a budget, creating with presets if needed and include all categories"""
        if month not in self.budgets:
            if self.recurring:
                self.budgets[month] = json.loads(json.dumps(self.recurring.list_presets()))
            else:
                self.budgets[month] = {cat: {} for cat in ['Shopping', 'Utilities', 'Home', 'Earnings']}
        # Ensure all categories exist for editing
        for cat in ['Shopping', 'Utilities', 'Home', 'Earnings']:
            self.budgets[month].setdefault(cat, {})
        return self.budgets[month]

    def create_or_update_budget(self, month):
        print(f"\nCreating/updating budget for {month}")
        # Start with presets if it's a new month
        base = {}
        if month not in self.budgets and self.recurring:
            base = json.loads(json.dumps(self.recurring.list_presets()))
        self.budgets.setdefault(month, base)

        for category in ['Shopping', 'Utilities', 'Home']:
            print(f"\nCategory: {category}")
            sub_budgets = self.budgets[month].get(category, {})
            # Display current presets/sub-budgets
            for sub, val in sub_budgets.items():
                print(f"  Pre-filled {sub}: {val:.2f}")

            # Allow editing or adding new
            while True:
                sub = input("  Enter subcategory name (blank to finish): ").strip()
                if not sub:
                    break
                amt = input(f"  Budget amount for {sub}: ").strip()
                try:
                    sub_budgets[sub] = float(amt)
                except ValueError:
                    print("    Invalid amount. Try again.")

            self.budgets[month][category] = sub_budgets

        self.save_budgets()
        print(f"Budget for {month} saved.")


class TransactionManager:
    def __init__(self, filepath):
        self.transactions = self.load_transactions(filepath)

    def load_transactions(self, filepath):
        txns = []
        with open(filepath, newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                txns.append(Transaction(
                    row['Date'],
                    row['Category'],
                    row['Subcategory'],
                    row['Amount'],
                    row.get('Description', '')
                ))
        return txns

class Analyzer:
    def __init__(self, transactions, budgets):
        self.transactions = transactions
        self.budgets = budgets

    def report(self, month):
        print(f"\nSpending report for {month}")
        budget = self.budgets.get(month)
        if not budget:
            print("No budget defined for this month.")
            return

        spent = defaultdict(lambda: defaultdict(float))
        for t in self.transactions:
            key = t.date.strftime('%Y-%m')
            if key == month:
                spent[t.category][t.subcategory] += t.amount

        print(f"\n{'Category':<12} {'Subcategory':<15} {'Budget':>10} {'Actual':>10}")
        print('-'*50)
        for cat, subs in budget.items():
            for sub, b_amt in subs.items():
                a_amt = spent[cat].get(sub, 0.0)
                print(f"{cat:<12} {sub:<15} {b_amt:10.2f} {a_amt:10.2f}")
        print('-'*50)

def main_menu():
    recurring_mgr = RecurringManager()
    budget_mgr   = BudgetManager(recurring_mgr=recurring_mgr)
    txns = []

    while True:
        print("\n--- Budget App Menu ---")
        print("1) Load transactions CSV")
        print("2) Create/Update monthly budget")
        print("3) View spending vs. budget report")
        print("4) Manage recurring presets")
        print("5) Exit")

        choice = input("Choose an option: ").strip()

        if choice == '4':
            print("\nRecurring Presets:")
            for cat, subs in recurring_mgr.list_presets().items():
                for sub, amt in subs.items():
                    print(f"  {cat} / {sub}: {amt:.2f}")

            action = input("Add (a) or Remove (r) a preset? ").lower()
            if action == 'a':
                cat = input(" Category: ").strip()
                sub = input(" Subcategory: ").strip()
                amt = input(" Amount: ").strip()
                recurring_mgr.add_preset(cat, sub, amt)
                print("Preset added.")
            elif action == 'r':
                cat = input(" Category: ").strip()
                sub = input(" Subcategory: ").strip()
                recurring_mgr.remove_preset(cat, sub)
                print("Preset removed.")
            else:
                print("No changes made.")

        # ... handle other choices (1–3,5) as before ...

        if choice == '1':
            path = input("Enter CSV file path: ").strip()
            try:
                tm = TransactionManager(path)
                txns = tm.transactions
                print(f"Loaded {len(txns)} transactions.")
            except Exception as e:
                print(f"Error: {e}")

        elif choice == '2':
            month = input("Enter month (YYYY-MM): ").strip()
            budget_mgr.create_or_update_budget(month)

        elif choice == '3':
            if not txns:
                print("Please load transactions first.")
                continue
            month = input("Enter month (YYYY-MM): ").strip()
            Analyzer(txns, budget_mgr.budgets).report(month)

        elif choice == '4':
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Try again.")

if __name__ == '__main__':
    main_menu()
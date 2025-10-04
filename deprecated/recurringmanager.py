import os
import json

RECURRING_FILE = 'recurring.json'

class RecurringManager:
    def __init__(self, filepath=RECURRING_FILE):
        self.filepath = filepath
        self.presets = self.load_presets()

    def load_presets(self):
        if not os.path.exists(self.filepath):
            # initialize empty structure
            data = {"Shopping": {}, "Utilities": {}, "Home": {}, "Earnings": {}}
            self.save_presets(data)
            return data

        with open(self.filepath, 'r') as f:
            return json.load(f)

    def save_presets(self, data=None):
        if data is not None:
            self.presets = data
        with open(self.filepath, 'w') as f:
            json.dump(self.presets, f, indent=4)

    def add_preset(self, category, subcategory, amount):
        self.presets.setdefault(category, {})
        self.presets[category][subcategory] = float(amount)
        self.save_presets()

    def remove_preset(self, category, subcategory):
        if subcategory in self.presets.get(category, {}):
            del self.presets[category][subcategory]
            self.save_presets()

    def list_presets(self):
        return self.presets
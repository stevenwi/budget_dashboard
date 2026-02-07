import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BudgetService, PresetData } from '../../services/budget.service';
import { AddNewSubcategoryComponent } from '../../shared/components/add-new-subcategory/add-new-subcategory';
import { PageHeaderComponent, HeaderAction } from '../../shared/components/page-header/page-header';

interface PresetItem {
  category: string;
  subcategory: string;
  amount: number;
}

@Component({
  selector: 'app-preset-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, AddNewSubcategoryComponent, PageHeaderComponent],
  templateUrl: './preset-manager.html',
  styleUrl: './preset-manager.css'
})
export class PresetManagerComponent implements OnInit {
  presets: PresetItem[] = [];
  loading = false;
  error: string | null = null;

  // For adding new presets
  newPreset = {
    category: '',
    subcategory: '',
    amount: ''
  };

  categories = ['Shopping', 'Utilities', 'Home', 'Earnings'];

  // Header actions
  pageHeaderActions: HeaderAction[] = [];

  constructor(
    private budgetService: BudgetService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPresets();

    // Initialize header actions
    this.pageHeaderActions = [
      {
        label: 'Back to Dashboard',
        icon: 'arrow_back',
        color: 'teal',
        action: () => this.goHome()
      }
    ];
  }

  loadPresets(): void {
    this.loading = true;
    this.error = null;

    this.budgetService.getPresets().subscribe({
      next: (response) => {
        this.presets = this.convertPresetsToArray(response.presets);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load presets';
        this.loading = false;
        console.error('Error loading presets:', err);
      }
    });
  }

  convertPresetsToArray(data: PresetData): PresetItem[] {
    const items: PresetItem[] = [];
    Object.keys(data).forEach(category => {
      Object.keys(data[category]).forEach(subcategory => {
        items.push({
          category,
          subcategory,
          amount: data[category][subcategory]
        });
      });
    });
    return items;
  }

  addPreset(): void {
    if (!this.newPreset.category || !this.newPreset.subcategory || !this.newPreset.amount) {
      return;
    }

    const amount = parseFloat(this.newPreset.amount);
    if (isNaN(amount)) {
      return;
    }

    this.budgetService.addPreset(
      this.newPreset.category,
      this.newPreset.subcategory,
      amount
    ).subscribe({
      next: () => {
        this.newPreset = { category: '', subcategory: '', amount: '' };
        this.loadPresets();
        this.showToast('Preset added successfully!', 'success');
      },
      error: (err) => {
        this.showToast('Failed to add preset', 'error');
        console.error('Error adding preset:', err);
      }
    });
  }

  removePreset(item: PresetItem): void {
    if (!confirm(`Remove preset: ${item.category} - ${item.subcategory}?`)) {
      return;
    }

    this.budgetService.removePreset(item.category, item.subcategory).subscribe({
      next: () => {
        this.loadPresets();
        this.showToast('Preset removed successfully!', 'success');
      },
      error: (err) => {
        this.showToast('Failed to remove preset', 'error');
        console.error('Error removing preset:', err);
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toast = document.createElement('div');
    const toastType = type === 'error' ? 'toast-error' : 'toast-success';
    toast.className = `toast ${toastType}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}

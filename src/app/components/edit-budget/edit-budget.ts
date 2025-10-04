import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService, BudgetData } from '../../services/budget';

@Component({
  selector: 'app-edit-budget',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-budget.html',
  styleUrl: './edit-budget.css'
})
export class EditBudgetComponent implements OnInit, AfterViewInit, OnDestroy {
  month: string = '';
  budgetData: BudgetData | null = null;
  loading = false;
  error: string | null = null;
  saving = false;

  categories = ['Shopping', 'Utilities', 'Home', 'Earnings'];

  // For managing expanded state of categories
  expandedCategories: Record<string, boolean> = {};

  // For adding new subcategories
  newSubcategory: Record<string, { name: string; amount: string }> = {};

  // For floating action bar
  @ViewChild('headerActions', { static: false }) headerActions!: ElementRef;
  showFloatingActions = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private budgetService: BudgetService,
    private elementRef: ElementRef
  ) {
    // Initialize new subcategory objects and expanded state
    this.categories.forEach(cat => {
      this.newSubcategory[cat] = { name: '', amount: '' };
      this.expandedCategories[cat] = false;
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.month = params['month'];
      if (this.month) {
        this.loadBudgetData();
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateAllInputClasses();
    }, 100);
  }

  ngOnDestroy(): void {
    // Component cleanup if needed
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.checkFloatingActionVisibility();
  }

  private checkFloatingActionVisibility() {
    if (this.headerActions) {
      const headerActionsRect = this.headerActions.nativeElement.getBoundingClientRect();
      const isHeaderActionsVisible = headerActionsRect.bottom > 0;
      this.showFloatingActions = !isHeaderActionsVisible;
    }
  }

  loadBudgetData() {
    this.loading = true;
    this.error = null;

    this.budgetService.editBudget(this.month).subscribe({
      next: (data) => {
        this.budgetData = data;
        this.loading = false;
        // Update input classes after data loads
        setTimeout(() => {
          this.updateAllInputClasses();
        }, 100);
      },
      error: (err) => {
        this.error = 'Failed to load budget data';
        this.loading = false;
        console.error('Error loading budget:', err);
      }
    });
  }

  getSubcategories(category: string): Array<{name: string, amount: number}> {
    if (!this.budgetData?.budget[category]) return [];

    return Object.entries(this.budgetData.budget[category]).map(([name, amount]) => ({
      name,
      amount: amount as number
    }));
  }

  addSubcategory(category: string) {
    const newSub = this.newSubcategory[category];
    if (!newSub.name.trim() || !newSub.amount.trim()) return;

    if (!this.budgetData) {
      this.budgetData = {
        month: this.month,
        budget: {},
        spent: {},
        total_budget: 0,
        total_spent: 0,
        total_diff: 0
      };
    }

    if (!this.budgetData.budget[category]) {
      this.budgetData.budget[category] = {};
    }

    this.budgetData.budget[category][newSub.name.trim()] = parseFloat(newSub.amount);

    // Clear the input fields
    this.newSubcategory[category] = { name: '', amount: '' };

    // Update input classes after clearing
    setTimeout(() => {
      this.updateAllInputClasses();
    }, 50);
  }

  updateSubcategoryAmount(category: string, subcategory: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const amount = parseFloat(target.value) || 0;

    if (this.budgetData?.budget[category]) {
      this.budgetData.budget[category][subcategory] = amount;
    }

    // Update has-value class for floating label
    this.updateInputClass(target);
  }

  updateInputClass(input: HTMLInputElement) {
    if (input.value && input.value.trim() !== '') {
      input.classList.add('has-value');
    } else {
      input.classList.remove('has-value');
    }
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateInputClass(target);
  }

  updateAllInputClasses() {
    const inputs = this.elementRef.nativeElement.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach((input: HTMLInputElement) => {
      this.updateInputClass(input);
    });
  }

  removeSubcategory(category: string, subcategory: string) {
    if (this.budgetData?.budget[category]) {
      delete this.budgetData.budget[category][subcategory];
    }
  }

  saveBudget() {
    if (!this.budgetData) return;

    this.saving = true;
    this.error = null;

    this.budgetService.saveBudget(this.month, this.budgetData.budget).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/view-budget', this.month]);
      },
      error: (err) => {
        this.error = 'Failed to save budget';
        this.saving = false;
        console.error('Error saving budget:', err);
      }
    });
  }

  toggleCategory(category: string) {
    this.expandedCategories[category] = !this.expandedCategories[category];
  }

  getCategoryTotal(category: string): number {
    if (!this.budgetData?.budget[category]) return 0;

    return Object.values(this.budgetData.budget[category])
      .reduce((total, amount) => total + (amount as number), 0);
  }

  getCategorySubcategoryCount(category: string): number {
    if (!this.budgetData?.budget[category]) return 0;
    return Object.keys(this.budgetData.budget[category]).length;
  }

  goHome() {
    this.router.navigate(['/']);
  }
}

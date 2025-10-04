import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BudgetService, BudgetData } from '../../services/budget';

@Component({
  selector: 'app-view-budget',
  imports: [CommonModule],
  templateUrl: './view-budget.html',
  styleUrl: './view-budget.css'
})
export class ViewBudgetComponent implements OnInit {
  month: string = '';
  budgetData: BudgetData | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private budgetService: BudgetService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.month = params['month'];
      if (this.month) {
        this.loadBudgetData();
      }
    });
  }

  loadBudgetData() {
    this.loading = true;
    this.error = null;

    this.budgetService.viewBudget(this.month).subscribe({
      next: (data) => {
        this.budgetData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load budget data';
        this.loading = false;
        console.error('Error loading budget:', err);
      }
    });
  }

  getBudgetEntries() {
    if (!this.budgetData?.budget) return [];

    const entries: any[] = [];
    Object.keys(this.budgetData.budget).forEach(category => {
      Object.keys(this.budgetData!.budget[category]).forEach(subcategory => {
        const budgetAmt = this.budgetData!.budget[category][subcategory];
        const actualAmt = this.budgetData!.spent[category]?.[subcategory] || 0;
        const diff = budgetAmt - actualAmt;

        entries.push({
          category,
          subcategory,
          budgetAmt,
          actualAmt,
          diff,
          isUnder: diff >= 0
        });
      });
    });

    return entries;
  }

  hasBudgetData(): boolean {
    return !!(this.budgetData?.budget && Object.keys(this.budgetData.budget).length > 0);
  }

  hasNoBudgetData(): boolean {
    return !this.budgetData?.budget || Object.keys(this.budgetData.budget).length === 0;
  }

  editBudget() {
    this.router.navigate(['/edit-budget', this.month]);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}

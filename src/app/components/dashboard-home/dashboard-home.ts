import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BudgetService, MonthItem } from '../../services/budget.service';
import { GoogleAuthModal } from '../google-auth-modal/google-auth-modal';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, GoogleAuthModal],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.css'
})
export class DashboardHomeComponent implements OnInit {
  months: MonthItem[] = [];
  showModal = false;
  selectedMonth = '';

  constructor(
    private budgetService: BudgetService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMonths();
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  loadMonths(): void {
    this.budgetService.getMonths().subscribe({
      next: (months) => this.months = months,
      error: (error) => console.error('Failed to load months:', error)
    });
  }

  openAddMonthModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  handleAddMonth(event: Event): void {
    event.preventDefault();
    if (this.selectedMonth) {
      this.router.navigate(['/edit-budget', this.selectedMonth]);
      this.closeModal();
      this.showToast('Budget created successfully!', 'success');
    } else {
      this.showToast('Please select a month', 'error');
    }
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

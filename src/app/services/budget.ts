import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BudgetData {
  month: string;
  budget: Record<string, Record<string, number>>;
  spent: Record<string, Record<string, number>>;
  total_budget: number;
  total_spent: number;
  total_diff: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  viewBudget(month: string): Observable<BudgetData> {
    return this.http.get<BudgetData>(`${this.apiUrl}/view_budget/${encodeURIComponent(month)}`);
  }

  editBudget(month: string): Observable<BudgetData> {
    return this.http.get<BudgetData>(`${this.apiUrl}/edit_budget/${encodeURIComponent(month)}`);
  }

  saveBudget(month: string, budget: Record<string, Record<string, number>>): Observable<any> {
    return this.http.post(`${this.apiUrl}/edit_budget/${encodeURIComponent(month)}`, budget);
  }

  getMonths(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/months`);
  }
}

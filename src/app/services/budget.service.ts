import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MonthItem {
  month: string;
  budget_total: number;
  spent_total: number;
  earnings: number;
  diff: number;
  status: 'under' | 'over';
}

export interface BudgetData {
  month: string;
  budget: {
    [category: string]: {
      [subcategory: string]: number;
    };
  };
}

export interface PresetData {
  [category: string]: {
    [subcategory: string]: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = 'http://budget.local:5000/api';

  constructor(private http: HttpClient) {}

  getMonths(): Observable<MonthItem[]> {
    return this.http.get<MonthItem[]>(`${this.apiUrl}/months`);
  }

  getBudget(month: string): Observable<BudgetData> {
    return this.http.get<BudgetData>(`${this.apiUrl}/edit_budget/${month}`);
  }

  saveBudget(month: string, budget: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/edit_budget/${month}`, budget);
  }

  getPresets(): Observable<PresetData> {
    return this.http.get<PresetData>(`${this.apiUrl}/presets`);
  }

  addPreset(category: string, subcategory: string, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/presets/add`, { category, subcategory, amount });
  }

  removePreset(category: string, subcategory: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/presets/remove`, { category, subcategory });
  }
}

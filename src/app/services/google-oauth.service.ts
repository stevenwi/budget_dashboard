import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface OAuthStatus {
  authenticated: boolean;
  message: string;
}

export interface Spreadsheet {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

export interface SpreadsheetsResponse {
  success: boolean;
  count: number;
  spreadsheets: Spreadsheet[];
}

export interface TransactionsResponse {
  success: boolean;
  spreadsheet_id: string;
  count: number;
  transactions: any[];
}

@Injectable({
  providedIn: 'root'
})
export class GoogleOAuthService {
  private apiUrl = 'http://budget.local:5000/api/oauth';
  private authenticatedSubject = new BehaviorSubject<boolean>(false);

  public authenticated$ = this.authenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check authentication status on init
    this.checkStatus().subscribe();
  }

  /**
   * Check OAuth authentication status
   */
  checkStatus(): Observable<OAuthStatus> {
    return this.http.get<OAuthStatus>(`${this.apiUrl}/status`).pipe(
      tap(status => this.authenticatedSubject.next(status.authenticated))
    );
  }

  /**
   * Initiate OAuth login flow
   * Redirects to Google authorization page
   */
  login(): void {
    window.location.href = `${this.apiUrl}/login`;
  }

  /**
   * Logout and clear saved credentials
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.authenticatedSubject.next(false))
    );
  }

  /**
   * Get list of user's Google Sheets
   */
  getSpreadsheets(): Observable<SpreadsheetsResponse> {
    return this.http.get<SpreadsheetsResponse>(`${this.apiUrl}/spreadsheets`);
  }

  /**
   * Get transactions from a specific spreadsheet
   */
  getTransactions(spreadsheetId: string): Observable<TransactionsResponse> {
    return this.http.get<TransactionsResponse>(
      `${this.apiUrl}/spreadsheet/${spreadsheetId}/transactions`
    );
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.authenticatedSubject.value;
  }
}

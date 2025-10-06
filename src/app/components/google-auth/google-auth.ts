import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleOAuthService, Spreadsheet, SpreadsheetsResponse } from '../../services/google-oauth.service';

@Component({
  selector: 'app-google-auth',
  imports: [CommonModule],
  templateUrl: './google-auth.html',
  styleUrl: './google-auth.css'
})
export class GoogleAuth implements OnInit {
  isAuthenticated = false;
  isLoading = false;
  spreadsheets: Spreadsheet[] = [];
  selectedSpreadsheetId: string | null = null;

  constructor(private googleOAuthService: GoogleOAuthService) {}

  ngOnInit(): void {
    // Subscribe to authentication status
    this.googleOAuthService.authenticated$.subscribe(
      authenticated => this.isAuthenticated = authenticated
    );

    // Check for OAuth callback success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oauth') === 'success') {
      this.loadSpreadsheets();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  login(): void {
    this.googleOAuthService.login();
  }

  logout(): void {
    this.isLoading = true;
    this.googleOAuthService.logout().subscribe({
      next: () => {
        this.isLoading = false;
        this.spreadsheets = [];
        this.selectedSpreadsheetId = null;
      },
      error: (error) => {
        console.error('Logout failed:', error);
        this.isLoading = false;
      }
    });
  }

  loadSpreadsheets(): void {
    this.isLoading = true;
    this.googleOAuthService.getSpreadsheets().subscribe({
      next: (response: SpreadsheetsResponse) => {
        this.spreadsheets = response.spreadsheets;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load spreadsheets:', error);
        this.isLoading = false;
      }
    });
  }

  selectSpreadsheet(spreadsheetId: string): void {
    this.selectedSpreadsheetId = spreadsheetId;
    this.loadTransactions(spreadsheetId);
  }

  loadTransactions(spreadsheetId: string): void {
    this.isLoading = true;
    this.googleOAuthService.getTransactions(spreadsheetId).subscribe({
      next: (response) => {
        console.log(`Loaded ${response.count} transactions from spreadsheet ${spreadsheetId}`);
        this.isLoading = false;
        // TODO: Integrate with transaction management system
      },
      error: (error) => {
        console.error('Failed to load transactions:', error);
        this.isLoading = false;
      }
    });
  }
}

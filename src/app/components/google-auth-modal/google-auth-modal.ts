import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleAuth } from '../google-auth/google-auth';
import { GoogleOAuthService } from '../../services/google-oauth.service';

@Component({
  selector: 'app-google-auth-modal',
  imports: [CommonModule, GoogleAuth],
  templateUrl: './google-auth-modal.html',
  styleUrl: './google-auth-modal.css'
})
export class GoogleAuthModal implements OnInit {
  isAuthenticated = false;
  showModal = false;

  constructor(private googleOAuthService: GoogleOAuthService) {}

  ngOnInit(): void {
    // Subscribe to authentication status
    this.googleOAuthService.authenticated$.subscribe(
      authenticated => this.isAuthenticated = authenticated
    );
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  login(): void {
    this.googleOAuthService.login();
  }

  logout(): void {
    this.googleOAuthService.logout().subscribe(() => {
      this.showModal = false;
    });
  }
}

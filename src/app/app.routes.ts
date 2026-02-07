import { Routes } from '@angular/router';
import { ViewBudgetComponent } from './components/view-budget/view-budget';
import { EditBudgetComponent } from './components/edit-budget/edit-budget';
import { DashboardComponent } from './components/dashboard/dashboard';
import { GoogleAuth } from './components/google-auth/google-auth';
import { PresetManagerComponent } from './components/preset-manager/preset-manager';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'google-auth', component: GoogleAuth },
  { path: 'presets', component: PresetManagerComponent },
  { path: 'view-budget/:month', component: ViewBudgetComponent },
  { path: 'edit-budget/:month', component: EditBudgetComponent },
  { path: '**', redirectTo: '/dashboard' }
];

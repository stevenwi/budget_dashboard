import { Component } from '@angular/core';
import { DashboardHomeComponent } from '../dashboard-home/dashboard-home';

@Component({
  selector: 'app-dashboard',
  template: `<app-dashboard-home></app-dashboard-home>`,
  standalone: true,
  imports: [DashboardHomeComponent]
})
export class DashboardComponent {
}
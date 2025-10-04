import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: '<dashboard-home></dashboard-home>',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true
})
export class DashboardComponent {
}
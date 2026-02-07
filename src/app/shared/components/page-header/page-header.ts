import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HeaderAction {
  label: string;
  icon?: string;
  color: 'teal' | 'purple';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  type?: 'button' | 'chip';
  action: () => void;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css'
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() badgeText: string = '';
  @Input() badgeColor: 'teal' | 'purple' = 'teal';
  @Input() actions: HeaderAction[] = [];
  @Input() showActionsCard: boolean = true;
}

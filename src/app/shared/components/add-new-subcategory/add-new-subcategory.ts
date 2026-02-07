import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActionButtonComponent } from '../action-button/action-button';

export interface SubcategoryFormData {
  category?: string;
  subcategory: string;
  amount: number | string;
}

@Component({
  selector: 'app-add-new-subcategory',
  standalone: true,
  imports: [CommonModule, FormsModule, ActionButtonComponent],
  templateUrl: './add-new-subcategory.html',
  styleUrl: './add-new-subcategory.css'
})
export class AddNewSubcategoryComponent {
  @Input() title: string = 'Add New Subcategory';
  @Input() showCategorySelect: boolean = false;
  @Input() categories: string[] = [];
  @Input() formData: SubcategoryFormData = { subcategory: '', amount: '' };
  @Input() buttonDisabled: boolean = false;
  @Output() addClicked = new EventEmitter<void>();
  @Output() inputChanged = new EventEmitter<Event>();

  onAdd(): void {
    this.addClicked.emit();
  }

  onInputChange(event: Event): void {
    this.inputChanged.emit(event);
  }

  get isFormValid(): boolean {
    if (this.showCategorySelect && !this.formData.category) {
      return false;
    }
    return !!(this.formData.subcategory && this.formData.amount);
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditBudget } from './edit-budget';

describe('EditBudget', () => {
  let component: EditBudget;
  let fixture: ComponentFixture<EditBudget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBudget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditBudget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

# UI Architecture Code Review

**Date:** 2025-10-05
**Reviewer:** UI Architect
**Application:** Budget Dashboard (Angular + Stencil.js)
**Review Type:** Architecture & Industry Standards Compliance

---

## Executive Summary

After conducting a comprehensive review of the budget dashboard application, I've identified **critical violations** of UI application tiering best practices and industry standards. The application requires significant architectural refactoring to meet enterprise-grade standards.

---

## Architecture Overview

**Current Stack:**
- Frontend: Angular 20 + Stencil.js Web Components
- Backend: Flask API (Python)
- Data Layer: JSON files + CSV

**Intended Pattern:** Micro-frontend architecture with web components

---

## CRITICAL ISSUES

### 🔴 **1. BROKEN SEPARATION OF CONCERNS**

#### **Issue: Stencil Component Directly Making API Calls**
**Location:** `poc/src/components/dashboard-home.tsx:31-38`

```typescript
async loadMonths() {
  try {
    const response = await fetch('http://budget.local:5000/api/months');
    this.months = await response.json();
  } catch (error) {
    console.error('Failed to load months:', error);
  }
}
```

**Violation:** Presentation components should NOT contain data access logic.

**Industry Standard:** Components should be pure presentation. Data access belongs in Angular services.

**Impact:**
- Cannot unit test component independently
- Cannot mock API for testing
- Violates Single Responsibility Principle
- Cannot reuse component with different data sources
- Hardcoded API URL prevents environment configuration

**Recommended Fix:**
```typescript
// Angular Service
@Injectable({ providedIn: 'root' })
export class MonthsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMonths(): Observable<MonthItem[]> {
    return this.http.get<MonthItem[]>(`${this.apiUrl}/months`);
  }
}

// Stencil Component
export class DashboardHome {
  @Prop() months: MonthItem[] = [];  // Receives data from parent
}

// Angular Parent Component
export class DashboardComponent {
  months$ = this.monthsService.getMonths();

  constructor(private monthsService: MonthsService) {}
}
```

---

### 🔴 **2. HARDCODED API ENDPOINTS**

**Locations:**
- `poc/src/components/dashboard-home.tsx:33` - Hardcoded `http://budget.local:5000/api/months`
- `src/app/services/budget.ts:18` - Hardcoded `http://budget.local:5000/api`

**Violations:**
- No environment configuration
- Cannot switch between dev/staging/prod
- Cannot run automated tests against test API
- Security risk (exposes internal network structure)

**Industry Standard:** Use environment files:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.budget.example.com'
};

// Service
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private apiUrl = environment.apiUrl;
}
```

**Files to Create:**
- `src/environments/environment.ts`
- `src/environments/environment.development.ts`
- `src/environments/environment.production.ts`

---

### 🔴 **3. DIRECT DOM MANIPULATION FOR UI FEEDBACK**

**Location:** `poc/src/components/dashboard-home.tsx:65-107`

```typescript
showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.innerHTML = `<div style="...">...</div>`;
  document.body.appendChild(toast);
  // ... imperative DOM manipulation
}
```

**Violations:**
- Imperative DOM manipulation in declarative framework
- Inline styles violate separation of concerns
- Creating elements outside component tree
- No centralized notification service
- Cannot test toast notifications
- Breaks Shadow DOM encapsulation

**Industry Standard:** Use Angular's Material Snackbar or create a NotificationService with component-based toasts.

**Recommended Fix:**

```typescript
// notification.service.ts
@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  error(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}

// Component usage
constructor(private notification: NotificationService) {}

someMethod() {
  this.notification.success('Budget created successfully!');
}
```

**Alternative (without Material):**

```typescript
// notification.service.ts
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notifications$ = new Subject<Notification>();

  success(message: string) {
    this.notifications$.next({ message, type: 'success' });
  }

  error(message: string) {
    this.notifications$.next({ message, type: 'error' });
  }

  getNotifications() {
    return this.notifications$.asObservable();
  }
}

// Toast component in Angular
@Component({
  selector: 'app-toast',
  template: `
    <div *ngIf="notification"
         class="toast"
         [class.success]="notification.type === 'success'"
         [class.error]="notification.type === 'error'">
      {{ notification.message }}
    </div>
  `
})
export class ToastComponent {
  notification: Notification | null = null;

  constructor(private notificationService: NotificationService) {
    this.notificationService.getNotifications().subscribe(n => {
      this.notification = n;
      setTimeout(() => this.notification = null, 3000);
    });
  }
}
```

---

### 🔴 **4. NAVIGATION USING window.location**

**Location:** `poc/src/components/dashboard-home.tsx:57`

```typescript
async handleAddMonth(event: Event) {
  event.preventDefault();
  if (this.selectedMonth) {
    // Navigate to edit budget for new month using Angular Router
    window.location.href = `/edit-budget/${this.selectedMonth}`;
    this.closeModal();
    this.showToast('Budget created successfully!', 'success');
  }
}
```

**Violations:**
- Full page reload defeats SPA architecture
- Loses application state
- Poor user experience (slower)
- Doesn't use Angular Router
- Cannot intercept navigation
- Cannot implement route guards
- Breaks browser back/forward behavior

**Industry Standard:** Emit event to Angular parent, let Angular Router handle navigation.

**Recommended Fix:**

```typescript
// Stencil Component
import { Component, Event, EventEmitter } from '@stencil/core';

export class DashboardHome {
  @Event() navigate!: EventEmitter<{ route: string; param: string }>;

  async handleAddMonth(event: Event) {
    event.preventDefault();
    if (this.selectedMonth) {
      this.navigate.emit({
        route: 'edit-budget',
        param: this.selectedMonth
      });
      this.closeModal();
    }
  }
}

// Angular Parent Component
@Component({
  selector: 'app-dashboard',
  template: `
    <dashboard-home
      (navigate)="onNavigate($event)">
    </dashboard-home>
  `
})
export class DashboardComponent {
  constructor(private router: Router) {}

  onNavigate(event: { route: string; param: string }) {
    this.router.navigate([`/${event.route}`, event.param]);
  }
}
```

---

### 🔴 **5. MISSING DATA MODELS AND INTERFACES**

**Location:** `poc/src/components/dashboard-home.tsx:3-10`

```typescript
interface MonthItem {
  month: string;
  budget_total: number;
  spent_total: number;
  earnings: number;
  diff: number;
  status: 'under' | 'over';
}
```

**Issues:**
- Interface only defined in component
- Not shared across application
- Angular service has different interface (`src/app/services/budget.ts:5-12`)
- Data models scattered throughout codebase
- No single source of truth
- Cannot guarantee type consistency

**Industry Standard:** Centralized models in `src/app/models/` or `src/app/interfaces/`.

**Recommended Structure:**

```
src/app/
├── models/
│   ├── index.ts              # Barrel export
│   ├── month-item.model.ts
│   ├── budget-data.model.ts
│   └── transaction.model.ts
```

**Recommended Fix:**

```typescript
// src/app/models/month-item.model.ts
export interface MonthItem {
  month: string;
  budget_total: number;
  spent_total: number;
  earnings: number;
  diff: number;
  status: 'under' | 'over';
}

// src/app/models/budget-data.model.ts
export interface BudgetData {
  month: string;
  budget: Record<string, Record<string, number>>;
  spent: Record<string, Record<string, number>>;
  total_budget: number;
  total_spent: number;
  total_diff: number;
}

// src/app/models/index.ts (Barrel export)
export * from './month-item.model';
export * from './budget-data.model';
export * from './transaction.model';

// Usage in components and services
import { MonthItem, BudgetData } from '@app/models';
```

---

### 🔴 **6. POOR STATE MANAGEMENT**

**Current State:**
- No centralized state management
- Each component manages own state independently
- No shared state between Angular and Stencil components
- No state persistence
- API calls on every component load
- Race conditions possible

**Industry Standard Options:**
1. **NgRx** (Redux pattern for Angular) - Best for large apps
2. **Akita** - Simpler than NgRx
3. **NGXS** - Redux with less boilerplate
4. **At minimum:** BehaviorSubjects in services

**Impact:**
- Data fetched multiple times unnecessarily
- Race conditions possible
- Difficult to debug state changes
- Cannot implement optimistic updates
- Cannot implement offline support
- Cannot implement undo/redo

**Recommended Fix (Minimum - BehaviorSubject):**

```typescript
// months.service.ts
@Injectable({ providedIn: 'root' })
export class MonthsService {
  private monthsSubject = new BehaviorSubject<MonthItem[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  months$ = this.monthsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadMonths() {
    // Only fetch if not already loaded
    if (this.monthsSubject.value.length > 0) {
      return;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.http.get<MonthItem[]>(`${environment.apiUrl}/months`)
      .pipe(
        catchError(err => {
          this.errorSubject.next('Failed to load months');
          this.loadingSubject.next(false);
          return of([]);
        })
      )
      .subscribe(months => {
        this.monthsSubject.next(months);
        this.loadingSubject.next(false);
      });
  }

  addMonth(month: MonthItem) {
    const current = this.monthsSubject.value;
    this.monthsSubject.next([...current, month]);
  }

  clearCache() {
    this.monthsSubject.next([]);
  }
}
```

**Recommended Fix (NgRx - Enterprise):**

```typescript
// State
export interface AppState {
  months: MonthsState;
  budgets: BudgetsState;
}

export interface MonthsState {
  items: MonthItem[];
  loading: boolean;
  error: string | null;
}

// Actions
export const loadMonths = createAction('[Months] Load');
export const loadMonthsSuccess = createAction(
  '[Months] Load Success',
  props<{ months: MonthItem[] }>()
);
export const loadMonthsFailure = createAction(
  '[Months] Load Failure',
  props<{ error: string }>()
);

// Reducer
const reducer = createReducer(
  initialState,
  on(loadMonths, state => ({ ...state, loading: true })),
  on(loadMonthsSuccess, (state, { months }) => ({
    ...state,
    items: months,
    loading: false,
    error: null
  })),
  on(loadMonthsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);

// Effects
@Injectable()
export class MonthsEffects {
  loadMonths$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMonths),
      mergeMap(() =>
        this.monthsService.getMonths().pipe(
          map(months => loadMonthsSuccess({ months })),
          catchError(error => of(loadMonthsFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private monthsService: MonthsService
  ) {}
}

// Component usage
export class DashboardComponent {
  months$ = this.store.select(state => state.months.items);
  loading$ = this.store.select(state => state.months.loading);

  constructor(private store: Store<AppState>) {
    this.store.dispatch(loadMonths());
  }
}
```

---

### 🔴 **7. INCONSISTENT ERROR HANDLING**

**Examples:**

`dashboard-home.tsx:33-37`:
```typescript
try {
  const response = await fetch('http://budget.local:5000/api/months');
  this.months = await response.json();
} catch (error) {
  console.error('Failed to load months:', error);  // Only logs, no user feedback
}
```

`edit-budget.ts:90-94`:
```typescript
error: (err) => {
  this.error = 'Failed to load budget data';  // Shows user feedback
  this.loading = false;
  console.error('Error loading budget:', err);
}
```

**Violations:**
- Inconsistent error handling patterns
- Some errors shown to user, others silently logged
- No centralized error handling service
- No error recovery strategies
- No error tracking/reporting

**Industry Standard:** Centralized error handling with HTTP interceptor

**Recommended Fix:**

```typescript
// error-handler.service.ts
@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  constructor(private notification: NotificationService) {}

  handleError(error: any, userMessage?: string) {
    // Log to console (replace with logging service in production)
    console.error('Error occurred:', error);

    // Show user-friendly message
    const message = userMessage || this.getErrorMessage(error);
    this.notification.error(message);

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // this.errorTracking.captureException(error);
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Cannot connect to server. Please check your connection.';
    }
    if (error.status >= 400 && error.status < 500) {
      return error.error?.message || 'Invalid request.';
    }
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return 'An unexpected error occurred.';
  }
}

// http-error.interceptor.ts
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private errorHandler: ErrorHandlerService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.errorHandler.handleError(error);
        return throwError(() => error);
      })
    );
  }
}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([HttpErrorInterceptor])
    )
  ]
};
```

---

### 🔴 **8. ARCHITECTURAL CONFUSION: MICRO-FRONTEND VS MONOLITH**

**Current State:**
- Angular app wraps Stencil components
- Stencil component (`dashboard-home`) contains business logic
- Angular components (`edit-budget`, `view-budget`) also exist
- Duplicate routing concerns (Angular Router + Stencil component navigation)

**Issue:** The architecture is neither a proper micro-frontend nor a proper monolith.

**Micro-Frontend Done Right:**
- Each micro-app is independently deployable
- Communication via events/custom events only
- No shared services or state
- Independent builds and deployments
- Clear team boundaries

**Monolith Done Right:**
- All components in Angular
- Shared services for data access
- Single build/deployment
- Router manages all navigation
- Centralized state management

**Current Implementation:** Worst of both worlds
- Tight coupling (Stencil component hardcodes API calls)
- Complex build process (Stencil → npm package → Angular)
- No clear boundaries
- Inconsistent patterns

**Recommendation:** Choose one architecture and commit to it.

**Option A: Pure Angular (RECOMMENDED for this app size)**

Benefits:
- Simpler architecture
- Single framework
- Better TypeScript integration
- Better tooling support
- Easier to maintain

Migration Path:
1. Convert Stencil components to Angular components
2. Remove Stencil build step
3. Simplify deployment

**Option B: Proper Micro-Frontends (Only if needed)**

When to choose:
- Multiple teams working independently
- Different release cycles needed
- Technology flexibility required

Requirements:
- Clear bounded contexts
- Event-driven communication
- Independent deployments
- Module federation or similar

---

### 🔴 **9. MISSING LAYERED ARCHITECTURE**

**Industry Standard Layers:**

```
┌─────────────────────────────────────┐
│  Presentation Layer                 │  Components (Smart & Dumb)
│  - Smart Components                 │  - Handle routing, orchestration
│  - Dumb Components                  │  - Pure presentation, @Input/@Output
├─────────────────────────────────────┤
│  Application Layer                  │  Services, State Management
│  - Services                         │  - Business logic coordination
│  - State Management                 │  - Application state
│  - Facades                          │  - Simplified API for components
├─────────────────────────────────────┤
│  Domain Layer                       │  Business Logic, Models
│  - Models/Interfaces                │  - Data structures
│  - Validators                       │  - Business rules
│  - Utilities                        │  - Pure functions
├─────────────────────────────────────┤
│  Infrastructure Layer               │  External Integrations
│  - API Clients                      │  - HTTP communication
│  - Local Storage                    │  - Persistence
│  - Third-party integrations         │  - External services
└─────────────────────────────────────┘
```

**Current Implementation:** All layers mixed together in components.

**Recommended Structure:**

```
src/app/
├── components/                  # Presentation Layer
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.css
│   ├── edit-budget/
│   └── view-budget/
├── services/                    # Application Layer
│   ├── budget.service.ts
│   ├── months.service.ts
│   ├── notification.service.ts
│   └── error-handler.service.ts
├── models/                      # Domain Layer
│   ├── month-item.model.ts
│   ├── budget-data.model.ts
│   └── index.ts
├── api/                         # Infrastructure Layer
│   ├── budget.api.ts
│   ├── http-error.interceptor.ts
│   └── api.config.ts
├── shared/                      # Shared utilities
│   ├── validators/
│   ├── pipes/
│   └── directives/
└── environments/                # Configuration
    ├── environment.ts
    └── environment.prod.ts
```

---

### 🟡 **10. MINOR ISSUES**

#### **A. Type Safety Violations**

**Location:** `view-budget.ts:56`

```typescript
const entries: any[] = [];  // Should have proper interface
```

**Fix:**
```typescript
interface BudgetEntry {
  category: string;
  subcategory: string;
  budgetAmt: number;
  actualAmt: number;
  diff: number;
  isUnder: boolean;
}

const entries: BudgetEntry[] = [];
```

#### **B. Magic Numbers**

**Location:** `dashboard-home.tsx:76,99`

```typescript
setTimeout(() => { toastElement.style.opacity = '1'; }, 10);
setTimeout(() => { toastElement.style.opacity = '0'; }, 3000);
```

**Fix:**
```typescript
// constants.ts
export const TOAST_FADE_IN_DELAY = 10;
export const TOAST_DURATION = 3000;
export const TOAST_FADE_OUT_DURATION = 300;

// usage
setTimeout(() => { toastElement.style.opacity = '1'; }, TOAST_FADE_IN_DELAY);
setTimeout(() => { toastElement.style.opacity = '0'; }, TOAST_DURATION);
```

#### **C. Inconsistent Naming Conventions**

**Issues:**
- `budgetData` vs `budget_total` (camelCase vs snake_case)
- `BudgetService` vs `budget_app.py`
- `getMonths()` vs `get_budget()` (Python)

**Fix:** Establish and enforce naming conventions:
- TypeScript/JavaScript: camelCase for variables, PascalCase for classes
- Python: snake_case
- Use DTOs to transform between conventions at API boundary

#### **D. No Loading States in Stencil Component**

**Issue:** Angular components have `loading` flags, Stencil component doesn't show loading spinner.

**Fix:**
```typescript
export class DashboardHome {
  @State() loading: boolean = false;

  async loadMonths() {
    this.loading = true;
    try {
      // ... fetch logic
    } finally {
      this.loading = false;
    }
  }

  render() {
    return (
      <div>
        {this.loading && <div class="spinner">Loading...</div>}
        {!this.loading && this.months.map(/* ... */)}
      </div>
    );
  }
}
```

#### **E. No Input Validation**

**Issue:** No validation on user inputs (amounts, month selection)

**Fix:**
```typescript
// validators/budget.validators.ts
export class BudgetValidators {
  static isValidAmount(value: string): boolean {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 1000000;
  }

  static isValidMonth(value: string): boolean {
    return /^\d{4}-\d{2}$/.test(value);
  }
}

// Component usage with Angular Forms
this.budgetForm = this.fb.group({
  amount: ['', [Validators.required, Validators.min(0), Validators.max(1000000)]],
  month: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]]
});
```

#### **F. No Error Boundaries**

**Issue:** Unhandled errors can crash the entire app

**Fix:**
```typescript
// error-boundary.component.ts
@Component({
  selector: 'app-error-boundary',
  template: `
    <div *ngIf="hasError" class="error-boundary">
      <h2>Something went wrong</h2>
      <button (click)="retry()">Retry</button>
    </div>
    <ng-content *ngIf="!hasError"></ng-content>
  `
})
export class ErrorBoundaryComponent implements OnInit {
  hasError = false;

  constructor(private errorHandler: ErrorHandler) {}

  ngOnInit() {
    // Set up global error handling
  }

  retry() {
    this.hasError = false;
    // Retry logic
  }
}
```

---

## RECOMMENDATIONS

### **Priority 1: Critical - Must Fix**

1. **Extract Data Access from Stencil Components**
   - Create Angular service for all API calls
   - Stencil components receive data via `@Prop()`
   - Angular parent components handle data fetching
   - **Estimated effort:** 8-12 hours

2. **Implement Environment Configuration**
   - Create `environment.ts` files
   - Remove all hardcoded URLs
   - Support dev/staging/prod environments
   - **Estimated effort:** 2-4 hours

3. **Fix Navigation**
   - Remove `window.location.href`
   - Emit custom events from Stencil
   - Angular handles routing
   - **Estimated effort:** 2-3 hours

4. **Centralize Error Handling**
   - Create `ErrorHandlingService`
   - Implement HTTP interceptor
   - Consistent user feedback
   - **Estimated effort:** 4-6 hours

**Total Priority 1:** 16-25 hours

---

### **Priority 2: High - Should Fix**

5. **Implement State Management**
   - Start with BehaviorSubjects in services
   - Consider NgRx for complex state
   - **Estimated effort:** 8-12 hours

6. **Centralize Models**
   - Create `src/app/models/` directory
   - Share interfaces across app
   - **Estimated effort:** 2-3 hours

7. **Replace Direct DOM Manipulation**
   - Create `NotificationService`
   - Use Angular Material Snackbar or custom component
   - **Estimated effort:** 3-4 hours

**Total Priority 2:** 13-19 hours

---

### **Priority 3: Medium - Nice to Have**

8. **Decide on Architecture**
   - Either: Pure Angular (recommended for this app size)
   - Or: Proper micro-frontends with clear boundaries
   - **Estimated effort:** 16-24 hours (if converting to pure Angular)

9. **Add Unit Tests**
   - Test services independently
   - Test components with mocked services
   - **Estimated effort:** 8-12 hours

10. **Implement Proper Logging**
    - Replace `console.error` with logging service
    - Support log levels (debug, info, warn, error)
    - **Estimated effort:** 4-6 hours

**Total Priority 3:** 28-42 hours

---

## TOTAL REFACTORING EFFORT

- **Priority 1 (Critical):** 16-25 hours
- **Priority 2 (High):** 13-19 hours
- **Priority 3 (Medium):** 28-42 hours

**Total Estimated Effort:** 57-86 hours

**Recommended Approach:** Fix Priority 1 issues first (1-2 sprints), then Priority 2 (1 sprint), then evaluate if Priority 3 is needed.

---

## INDUSTRY STANDARDS CHECKLIST

| Standard | Current | Required | Priority |
|----------|---------|----------|----------|
| Separation of Concerns | ❌ | ✅ | P1 |
| Environment Configuration | ❌ | ✅ | P1 |
| Centralized State Management | ❌ | ✅ | P2 |
| Proper Error Handling | ⚠️ | ✅ | P1 |
| Type Safety | ⚠️ | ✅ | P3 |
| Layered Architecture | ❌ | ✅ | P2 |
| Dependency Injection | ⚠️ | ✅ | P1 |
| Testability | ❌ | ✅ | P3 |
| SPA Navigation | ❌ | ✅ | P1 |
| API Abstraction | ⚠️ | ✅ | P1 |
| Input Validation | ❌ | ✅ | P3 |
| Error Boundaries | ❌ | ✅ | P3 |
| Consistent Naming | ⚠️ | ✅ | P3 |
| No Magic Numbers | ❌ | ✅ | P3 |
| Loading States | ⚠️ | ✅ | P3 |

**Legend:**
- ✅ Implemented
- ⚠️ Partially Implemented
- ❌ Missing

---

## CONCLUSION

The application has **critical architectural violations** that prevent it from meeting enterprise UI standards. The most significant issues are:

1. **Broken Separation of Concerns** - Business logic in presentation components
2. **No Environment Configuration** - Hardcoded URLs throughout
3. **Poor State Management** - No centralized state, repeated API calls
4. **Inconsistent Error Handling** - Silent failures and inconsistent UX
5. **Architectural Confusion** - Neither proper micro-frontend nor monolith

**Immediate Action Required:**
Focus on Priority 1 fixes to establish proper architectural foundation. These fixes will enable better testing, maintainability, and scalability.

**Long-term Recommendation:**
Consider converting to pure Angular architecture. The current Stencil integration adds complexity without clear benefits for an application of this size and team structure.

---

**Review Date:** 2025-10-05
**Next Review:** After Priority 1 fixes are implemented

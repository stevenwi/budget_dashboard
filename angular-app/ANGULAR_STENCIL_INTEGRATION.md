# Angular + StencilJS Integration Strategy

This document outlines the approach for creating an Angular application that consumes the StencilJS components from the POC directory.

## Architecture Overview

```
budget_dashboard/
├── poc/                          # StencilJS component library
│   ├── src/components/           # Web components (dashboard-home, preset-manager, etc.)
│   └── dist/                     # Built component library
├── angular-app/                  # Angular application
│   ├── src/                      # Angular source code
│   └── dist/                     # Angular build output
└── app.py                        # Flask API backend
```

## Integration Strategy

### 1. StencilJS Library Setup

**Current State:**
- StencilJS POC with `dashboard-home` and `preset-manager` components
- Components built with Shadow DOM and Material Design
- Global styles configured for Material Icons and Materialize CSS

**Required Changes:**
- Add Angular output target to StencilJS configuration
- Build distributable library for Angular consumption
- Generate Angular component wrappers automatically

### 2. Angular Application Architecture

**Framework:** Angular 17+ with standalone components approach

**Key Features:**
- Routing between different budget management views
- Service layer for Flask API communication
- Material Design theming (reusing Materialize CSS from StencilJS)
- Reactive forms for budget editing
- State management for user interactions

**Component Structure:**
```
angular-app/src/
├── app/
│   ├── components/
│   │   ├── app-shell/           # Main navigation shell
│   │   └── pages/               # Route-based page components
│   ├── services/
│   │   ├── budget.service.ts    # Flask API integration
│   │   └── navigation.service.ts
│   └── models/
│       └── budget.models.ts     # TypeScript interfaces
```

## Implementation Steps

### Phase 1: StencilJS Library Distribution

1. **Configure Angular Output Target**
   ```typescript
   // poc/stencil.config.ts
   import { angularOutputTarget } from '@stencil/angular-output-target';

   export const config: Config = {
     outputTargets: [
       {
         type: 'dist',
         esmLoaderPath: '../loader',
       },
       angularOutputTarget({
         componentCorePackage: 'budget-components',
         directivesProxyFile: '../angular-app/src/app/components/stencil-generated/components.ts',
       }),
     ],
   };
   ```

2. **Build Component Library**
   - Generate Angular component wrappers
   - Create npm-ready distribution
   - Export TypeScript definitions

### Phase 2: Angular Application Setup

1. **Create Angular Workspace**
   ```bash
   ng new angular-app --routing --style=css --standalone
   ```

2. **Install Dependencies**
   - Angular CLI and core packages
   - Generated StencilJS component library
   - HTTP client for API communication

3. **Configure Module System**
   ```typescript
   // Import generated StencilJS components
   import { ComponentLibraryModule } from './components/stencil-generated/components';

   @NgModule({
     imports: [ComponentLibraryModule],
     // ...
   })
   ```

### Phase 3: Component Integration

1. **Shell Application**
   - Navigation component using Angular Router
   - Integration with StencilJS `dashboard-home` component
   - Service layer for Flask API calls

2. **Route Configuration**
   ```typescript
   const routes: Routes = [
     { path: '', component: DashboardPageComponent },
     { path: 'edit/:month', component: EditBudgetPageComponent },
     { path: 'view/:month', component: ViewBudgetPageComponent },
     { path: 'trends', component: TrendsPageComponent },
     { path: 'presets', component: PresetsPageComponent },
   ];
   ```

3. **Service Integration**
   ```typescript
   @Injectable()
   export class BudgetService {
     constructor(private http: HttpClient) {}

     getMonths(): Observable<MonthItem[]> {
       return this.http.get<MonthItem[]>('http://localhost:5000/api/months');
     }
   }
   ```

### Phase 4: Advanced Features

1. **Event Handling**
   - StencilJS custom events → Angular event handlers
   - Navigation coordination between Angular Router and StencilJS components

2. **Form Integration**
   - Angular reactive forms with StencilJS form components
   - Validation and error handling

3. **State Management**
   - Optional: NgRx for complex state scenarios
   - Service-based state for simpler interactions

## Benefits of This Approach

### For StencilJS Components
- **Framework Agnostic**: Components work in any framework
- **Shadow DOM**: Proper style encapsulation
- **TypeScript**: Full type safety and IntelliSense

### For Angular Application
- **Native Integration**: StencilJS components behave like Angular components
- **Change Detection**: Automatic Angular change detection
- **Observables**: Events converted to RxJS observables
- **Form Controls**: Optional Angular form integration

### For Development
- **Separation of Concerns**: UI components vs application logic
- **Reusability**: Components can be used in other frameworks
- **Incremental Migration**: Gradual replacement of existing components

## API Integration

The Angular application will communicate with the existing Flask backend:

- **Endpoints**: `/api/months`, `/api/edit_budget`, `/api/view_budget`, etc.
- **CORS**: Already configured for cross-origin requests
- **HTTP Client**: Angular HttpClient for reactive API calls
- **Error Handling**: Centralized error handling service

## Styling Strategy

- **Global Styles**: Material Icons and Materialize CSS loaded globally
- **Component Styles**: Individual component styling within Shadow DOM
- **Angular Theming**: Optional Angular Material for additional components
- **Responsive Design**: Mobile-first approach using Materialize grid system

## Development Workflow

1. **Component Development**: Build and test StencilJS components in POC
2. **Library Build**: Generate Angular wrappers and distribution
3. **Angular Integration**: Use components in Angular pages
4. **API Integration**: Connect to Flask backend
5. **Testing**: Unit tests for Angular logic, E2E tests for full flow

This approach provides a modern, maintainable architecture that leverages the strengths of both StencilJS and Angular while maintaining integration with the existing Flask backend.
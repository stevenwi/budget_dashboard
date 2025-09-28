import { bootstrapApplication } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Import StencilJS components
import { defineCustomElements } from 'budget-components/loader';

// Define custom elements
defineCustomElements();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

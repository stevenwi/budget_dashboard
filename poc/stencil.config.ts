import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'poc',
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null // disable service workers
    },
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
    },
  ],
  // globalStyle removed - Material Icons and Materialize CSS are loaded in Angular index.html
  // Shadow DOM components cannot use @import rules in global styles
  devServer: {
    reloadStrategy: 'pageReload',
    port: 3333,
    openBrowser: false,
    historyApiFallback: {
      index: '/index.html'
    },
    // Proxy API calls to Flask backend
    proxy: [
      {
        path: '/api',
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    ]
  }
};

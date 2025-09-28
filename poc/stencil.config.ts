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
  globalStyle: 'src/global/app.css',
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

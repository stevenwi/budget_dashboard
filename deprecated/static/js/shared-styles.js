// Shared styles for web components to avoid redundant CSS loading
export const materializeCSS = `
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
`;

export const chipActionStyles = `
  <style>
    .chip-action {
      background: #fff !important;
      color: #000 !important;
      box-shadow: 0 2px 6px rgba(0,0,0,0.18) !important;
      font-weight: 600 !important;
      border: none !important;
      transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s;
      cursor: pointer;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 32px !important;
      line-height: 32px !important;
      padding: 0 16px !important;
      border-radius: 16px !important;
      text-transform: none !important;
      text-decoration: none !important;
      vertical-align: middle !important;
    }
    .chip-action:hover {
      background: #f2f2f2 !important;
      color: #222 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.28) !important;
      transform: translateY(-2px) scale(1.04);
    }
  </style>
`;

// Create a shared stylesheet that can be adopted by shadow roots
// Initialize this immediately when the module loads
if (!window.sharedChipStyles) {
  window.sharedChipStyles = new CSSStyleSheet();
  window.sharedChipStyles.replaceSync(chipActionCSS);
}

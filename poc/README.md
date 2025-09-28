# StencilJS POC for Micro-Frontend Architecture

This folder contains a minimal StencilJS project demonstrating a micro-frontend architecture similar to our homepage. The initial micro-frontend is a `preset-manager` web component.

## Structure
- `preset-manager/` - Stencil component for managing presets
- `index.html` - Example homepage loading the micro-frontend(s)

## How to Run
This is a proof-of-concept. To run locally:
1. Install dependencies: `npm install`
2. Start dev server: `npm start`

---

## Example
The homepage loads the `preset-manager` micro-frontend as a web component.

```
<preset-manager></preset-manager>
```

---

This POC demonstrates how StencilJS can be used to build and compose micro-frontends for our architecture.

# HI | Connect (Alt Design)

This repo is a **drop-in** digital business card that matches the provided mockups (desktop + mobile) and pulls employees from `employees.csv`.

## How it works
- Employees live in `employees.csv` (add rows, keep the headers).
- Load a specific employee with `?u=employee-slug`
  - Example: `.../pages/connect-V2?u=jessica-flanders`

## IMPORTANT: Shopify URL for sharing + QR
This build **always** generates QR/share links using the Shopify page URL so customers don’t see GitHub.

Update this constant in `app.js` if your Shopify page changes:
```js
const SHOPIFY_BASE_URL = "https://www.highlightindustries.net/pages/connect-V2";
```

## Files
- `index.html`
- `styles.css`
- `app.js`
- `employees.csv`
- `assets/building.jpg` (default)
- `assets/jessica-flanders.png` (employee photo)

## Shopify
Embed your GitHub Pages URL using an iframe on the Shopify page, just like your current setup.


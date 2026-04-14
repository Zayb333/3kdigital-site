# 3K Digital — Official Website

> Precision Software. Elevated Experiences.

Official website for [3K Digital](https://3kdigital.com) — a parent company and digital ecosystem focused on business automation software, developer tools, and creative digital products.

---

## Project Structure

```
3kdigital-site/
├── index.html              # Main HTML
├── css/
│   └── styles.css          # All styles (CSS variables, layout, components)
├── js/
│   └── main.js             # Animations, interactions, particle canvas
├── assets/
│   └── logos/
│       ├── 3k-digital-logo.png
│       ├── 3kstreams-logo.png
│       ├── bris-royale-logo.png
│       ├── zaylin-burris-logo.png
│       └── una-logo.png
└── README.md
```

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `production` | Live site — hosted via GitHub Pages. **Never push directly.** |
| `development` | Active development — all changes go here first |

**Workflow:**
1. All changes are made on `development`
2. Changes are reviewed and approved
3. Only then are they merged into `production`

---

## Hosting

The site is hosted via **GitHub Pages** from the `production` branch.

**Setup:** `Settings → Pages → Source: production branch, / (root)`

Live URL: `https://YOUR_USERNAME.github.io/3kdigital-site/`

---

## Adding Ecosystem Businesses

In `index.html`, find the `#eco-grid` section. Copy and paste a `.eco-card` block:

```html
<div class="eco-card reveal reveal-delay-1">
  <div class="eco-logo-wrap">
    <img src="assets/logos/YOUR-LOGO.png" alt="Brand Name">
  </div>
  <div class="eco-desc">Your brand description here.</div>
  <div class="eco-footer">
    <span class="badge badge-live">Live</span>   <!-- or badge-soon -->
    <a href="https://yoursite.com" class="eco-link">Visit →</a>
  </div>
</div>
```

Add the logo PNG to `assets/logos/` and you're done.

---

## Adding Tool Suite Products

In `index.html`, find the `#tools` section. Copy a `.tool-card` block:

```html
<div class="tool-card featured reveal">
  <div class="tool-icon tool-icon-fc">⚡</div>   <!-- change emoji/class -->
  <div class="tool-name">Tool Name</div>
  <div class="tool-desc">Tool description.</div>
  <a href="#" class="tool-link">Open Tool</a>
</div>
```

---

## Customization

All colors and design tokens live at the top of `css/styles.css` as CSS variables:

```css
:root {
  --accent-cyan: #00c8ff;
  --accent-purple: #7b5ea7;
  --accent-violet: #a855f7;
  /* ... */
}
```

Change them there and the entire site updates.

---

© 2025 3K Digital. All rights reserved.

# FileCompare — by 3K Digital

A production-quality, zero-dependency file comparison tool with a premium landing page.

Compare text files, code, CSVs, PDFs, configs, and more — side by side, with character-level diff highlighting.

---

## Live demo

Open `index.html` directly in any modern browser — no build step required.

---

## Project structure

```
filecompare/
├── index.html          # Entry point — landing page + app shell
├── css/
│   ├── base.css        # CSS variables, reset, shared utilities
│   ├── landing.css     # Landing page styles (nav, hero, sections, form, footer)
│   └── app.css         # App styles (toolbar, upload zones, diff panels, resizer)
├── js/
│   ├── diff.js         # Myers diff algorithm (line-level + character-level)
│   ├── pdf.js          # PDF text extraction via pdf.js (CDN)
│   └── app.js          # Application logic (state, rendering, scroll sync, UI)
└── README.md
```

---

## Features

### Landing page
- Sticky nav with logo and CTA
- Animated hero section
- Live product preview mockup (rendered HTML, not an image)
- Value propositions grid
- Use-case cards (Engineering · Finance · Legal)
- Early-access contact form
- Footer with 3K Digital branding

### FileCompare MVP
| Feature | Detail |
|---|---|
| **File support** | TXT, JSON, XML, CSV, HTML, CSS, JS, TS, JSX, TSX, Python, C#, Java, Markdown, YAML, TOML, INI, SQL, Shell, PDF, and more |
| **PDF extraction** | Human-readable text via pdf.js; graceful fallback for scanned/image PDFs |
| **Diff algorithm** | Myers shortest-edit-script — the same class used by Git |
| **Character diff** | Changed lines get per-character add/delete highlights |
| **Side-by-side** | Two resizable panels, aligned by diff row |
| **Inline mode** | Unified diff in a single panel |
| **Scroll sync** | Panels scroll together by default; toggle to disable |
| **Resizable panels** | Drag the centre divider to rebalance widths |
| **Status bar** | Live counts of added / removed / changed lines |
| **Loading overlay** | Shown while the diff engine runs on large files |
| **Drag & drop** | Drop files directly onto either upload zone |
| **Error handling** | Human-readable messages for unreadable or image-based files |

---

## Getting started

### Option 1 — open directly
```bash
open index.html   # macOS
start index.html  # Windows
xdg-open index.html  # Linux
```

### Option 2 — local server (recommended for PDF support)
```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# Then open http://localhost:8080
```

> **Note:** PDF extraction relies on pdf.js loaded from cdnjs.cloudflare.com.  
> A local server is recommended so the browser doesn't block the CDN fetch due to `file://` origin restrictions.

---

## Deployment

The app is fully static — deploy anywhere that serves HTML:

| Platform | Command / steps |
|---|---|
| **GitHub Pages** | Push to `main`, enable Pages from repo Settings |
| **Netlify** | Drag the folder into the Netlify dashboard |
| **Vercel** | `vercel deploy` from the project root |
| **Cloudflare Pages** | Connect repo, set build output to `/` |
| **Any CDN / S3** | Upload all files, preserve directory structure |

No build step, no `node_modules`, no environment variables.

---

## Browser support

Chrome 90+, Firefox 90+, Safari 15+, Edge 90+.  
Requires ES2020 support (optional chaining, `Array.from`, `Int32Array`).

---

## External dependencies

| Library | Version | Purpose | Source |
|---|---|---|---|
| [pdf.js](https://mozilla.github.io/pdf.js/) | 3.11.174 | PDF text extraction | cdnjs |

All other logic is vanilla JavaScript — no frameworks, no bundler.

---

## Roadmap / future improvements

- [ ] Virtual scrolling for very large files (100k+ lines)
- [ ] Syntax highlighting (highlight.js integration)
- [ ] Keyboard shortcuts (next/prev diff hunk)
- [ ] Export diff as HTML or patch file
- [ ] Binary / hex view toggle
- [ ] Collapsible unchanged regions
- [ ] Mobile touch support for the resizer

---

## Brand

**FileCompare** is a product by [3K Digital](https://3kdigital.io).

---

## License

MIT — see `LICENSE` for details.

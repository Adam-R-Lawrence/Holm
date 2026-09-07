# Holm

Holm deploys a static GitHub Pages site: HTML, CSS, JavaScript, and static assets.
Sass, Vite, ESLint, and Playwright are supported development tools; do not add a
server runtime requirement to deployed pages. Keep content/data in the existing
HTML and `data/` structure and behavior in `javascript/`.

Use the scripts in `package.json`:

- Content-only changes: inspect changed links, content, and affected page layout.
- Styling changes: edit the owning Sass/CSS source; for Sass run
  `npm run build:css` and `npm run check:css`, then inspect affected pages.
- Interactive JavaScript changes: run `npm run lint` and the closest Playwright
  test with `npm run test:e2e -- <test-file>`. Widen for shared navigation,
  fragments, theme, or other cross-page behavior.
- `npm run dev` starts the Vite preview server for local browser inspection.

Keep generated `styles/styles.min.css` in sync with `styles/scss/main.scss` when
Sass changes. No browser suite is needed for instruction-only documentation.

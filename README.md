# Adam Lawrence Personal Website

This repository contains the source code for the personal website of **Adam Lawrence**, a civil engineering PhD student at UIUC. The site is composed of static HTML, CSS, and JavaScript files that showcase research interests, projects, publications, and an embedded resume. It is intended for deployment via GitHub Pages.

## Frontend Architecture

The runtime JavaScript now uses a modular app entrypoint:

- `javascript/functions.js`: compatibility shim that preserves global handlers (`toggleTheme`, `toggleLanguage`) and boots the module app.
- `javascript/app/bootstrap.js`: startup orchestration and page-level wiring.
- `javascript/app/features/*`: shared concerns (theme, footer "last updated", fragment loading).
- `javascript/app/i18n/localization.js`: language state, translation loading, and localized copy helpers.
- `javascript/app/pages/*`: page renderers for projects, publications, and writings.
- `javascript/app/utils/*`: DOM helpers, path resolution, and cached fetch utilities.

This split keeps behavior unchanged for existing HTML while making future refactors and testing easier.

## Local Development

Install dev tooling, start the local server, and open the site at `http://127.0.0.1:4173/`:

```bash
npm install
npm run dev
```

Press `Ctrl+C` in the terminal running Vite to stop the server.

## Quality Checks

Run checks locally before publishing:

```bash
npm run lint
npm run check:css
npm run test:e2e
```

CI runs the same lint and Playwright smoke tests via `.github/workflows/ci.yml`.

## License

This project is licensed under the [MIT License](LICENSE).

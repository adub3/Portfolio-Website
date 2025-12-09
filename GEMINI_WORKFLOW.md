# Gemini Workflow Guide for Portfolio-Website

## Project Overview
- **Type:** React + Vite + Three.js + TypeScript
- **Deployment:** GitHub Pages

## Branching Strategy
- **`source` (PRIMARY):** 
  - **Work here.** All edits, new features, and source code changes belong on this branch.
  - **Action:** Commit and push changes here to save the raw code.
  
- **`gh-pages` (DEPLOYMENT):** 
  - **Do not edit manually.** This branch contains only the *built* assets (compiled JS/HTML).
  - **Action:** Updated automatically via `npm run deploy`.

- **`main`:** 
  - Legacy/Default branch. Currently effectively unused in favor of `source`. Avoid pushing here to prevent confusion with the deployment setup.

## Workflow Instructions

### 1. How to Save Work (Source Code)
When asked to "save", "commit", or "push" code changes:
```bash
git add .
git commit -m "Descriptive message"
git push origin source
```

### 2. How to Deploy (Update Live Website)
When asked to "publish", "deploy", or "update the site":
```bash
npm run deploy
```
*This command automatically runs `npm run build` and pushes the `dist/` folder to the `gh-pages` branch.*

### 3. Local Development
To start the preview server:
```bash
npm run dev
```

## Critical Configuration
- **Vite Base Path:** `vite.config.ts` must contain `base: '/Portfolio-Website/'` for assets to load correctly on GitHub Pages.
- **Scripts:** `package.json` includes `predeploy` (build) and `deploy` (gh-pages) scripts.

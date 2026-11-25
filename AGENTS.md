# AGENTS.md — textmaker

## What this is
JavaScript tool for generating text variations by sampling and combining lines from up to five data columns. Client-side browser app.

## Stack
- JavaScript (browser)
- HTML/CSS
- Vue.js (vuejs/ variant)
- Vite (build tool for vuejs variant)
- Docker (nginx)

## Build
```bash
# Plain JS version: no build needed
# Vue.js version:
cd vuejs && npm install && npm run build
```

## Run
Open `public/index.html` in browser, or use docker-compose. Demo at https://textmaker.myridia.com.

## Structure
- `public/index.html` — main app page
- `public/js/app.js` — core text generation logic
- `public/js/main.js` — app initialization
- `public/css/app.css` — styles
- `vuejs/` — Vue.js rewrite with Vite
- `dockers/` — docker-compose setup
- `pages/public/img/` — logos and screenshots

## Conventions
- No comments in code unless asked.
- Verify: `bash -n dockers/ask.sh`

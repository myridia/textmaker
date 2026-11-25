# AGENTS.md — textmaker

## What this is
Client-side browser tool for generating text variations by filling `{}` placeholders from up to five data columns. Optimized for batch SQL queries.

## Stack
- JavaScript (browser, no framework)
- HTML/CSS
- Docker (nginx)

## Build
No build step and no npm dependencies.

## Run
Open `public/index.html` in browser, or use:

```bash
./ask.sh
```

Demo at https://textmaker.myridia.com.

## Task Runner
`./ask.sh` builds its menu from `ask.d/*.sh` — each script carries `# id:`, `# group:`, and `# desc:` headers. Tasks can also be run directly: `sh ask.d/start_docker.sh`.
- 1 Check — verify JavaScript and shell syntax
- 2 Start — Docker on port 80
- 3 Stop — Docker services
- 4 Clean — this project's Docker state

## Structure
- `public/index.html` — main app page
- `public/js/app.js` — core text generation logic
- `public/js/main.js` — app initialization and error display
- `public/js/xlsx.js` — browser-side XLSX parser and import filling
- `public/css/app.css` — styles
- `test/generator.test.js` — generator tests
- `test/dynamic_columns.test.js` — dynamic column tests
- `test/xlsx.test.js` — XLSX parser tests
- `dockers/` — docker-compose setup
- `pages/public/img/` — logos and screenshots

## Behavior
- Reads all value textareas; five are shown by default, + adds one, × removes one, and blank/whitespace-only lines are ignored
- XLSX import scans worksheets: the first row contains headers, a `query` header supplies the template and is excluded, and without one all headers stay as value columns and the current query is kept
- One output line is generated per populated row across all columns
- Shorter columns reuse their last value
- `{}` placeholders are filled in column order
- Single quotes are doubled for SQL string literals
- A query with more `{}` placeholders than value columns shows an error
- A query with no `{}` placeholders is emitted once
- A Table field defaults to `table`; query starts with `UPDATE <table> SET <col>='{}' ...;` with every column in SET and no automatic WHERE clause
- Single page with a simple footer showing copyright and license

## Conventions
- No comments in code unless asked.
- Verify: `bash -n dockers/ask.sh`

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
- `public/css/app.css` — styles
- `test/generator.test.js` — generator tests
- `test/dynamic_columns.test.js` — dynamic column tests
- `dockers/` — docker-compose setup
- `pages/public/img/` — logos and screenshots

## Behavior
- Reads all value textareas; five are shown by default and more can be added with +; blank/whitespace-only lines are ignored
- One output line is generated per populated row across all columns
- Shorter columns reuse their last value
- `{}` placeholders are filled in column order
- Single quotes are doubled for SQL string literals
- A query with more `{}` placeholders than value columns shows an error
- A query with no `{}` placeholders is emitted once
- Single page with a simple footer showing copyright and license

## Conventions
- No comments in code unless asked.
- Verify: `bash -n dockers/ask.sh`

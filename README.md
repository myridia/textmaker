<img src="textmaker.svg" alt="textmaker" width="120">

# ![TextMaker](pages/public/img/icon_192x192.png) TextMaker

TextMaker is a client-side JavaScript tool for generating text variations by filling `{}` placeholders from up to five columns of values. It is mainly used to create batch SQL queries.

## Features

- Five value columns by default; add with + and remove with ×
- XLSX import: first row headers, `query` header for the template, other headers for value columns
- `{}` placeholders filled in column order
- One output line per input row
- Shorter columns reuse their last value
- Blank input lines are ignored
- Single quotes are doubled for SQL string literals
- Clear error when the query has more placeholders than value columns
- Table field defaults to `table`; query auto-fills `UPDATE <table> SET ...;`
- Runs entirely in the browser; no build step and no npm dependencies

## Demo

Live demo: https://textmaker.myridia.com

## How it works

Example query:

```sql
DELETE FROM table1 WHERE name = '{}' AND date = '{}';
```

If column 1 contains:

```text
Alice
Bob
```

and column 2 contains:

```text
2026-11-25
```

the result is:

```sql
DELETE FROM table1 WHERE name = 'Alice' AND date = '2026-11-25';
DELETE FROM table1 WHERE name = 'Bob' AND date = '2026-11-25';
```

Rules:

- one output line per populated row across all columns
- shorter columns reuse their last value
- blank and whitespace-only lines are ignored
- single quotes in values are doubled automatically
- extra `{}` placeholders show an error in the red message area
- a query without `{}` is emitted once
- the query starts as `UPDATE <table> SET a='{}',b='{}';`; every column is included in SET and no WHERE clause is added automatically

## XLSX import

Upload an `.xlsx` file. TextMaker scans the worksheets and uses the first one with a usable header row:

```text
Query                                                    | name  | date
DELETE FROM t WHERE n = '{}' AND d = '{}';               | Alice | 2026-11-25
                                                         | Bob   | 2026-11-26
```

The header named `query` supplies the query template and is not imported as a value column. `sql`, `template`, `text`, `statement`, and `command` are accepted too. If no query header exists, every header stays as a value column and the current Query box is kept. Extra columns are created automatically. Parsing happens entirely in the browser with no npm dependencies.

## Task Runner

Run:

```bash
./ask.sh
```

Menu:

```text
1  Check - verify JavaScript and shell syntax
2  Start - Docker (port 80)
3  Stop - Docker services
4  Clean - this project's Docker state
0  Exit
```

Individual tasks can be run directly:

```bash
sh ask.d/start_docker.sh
```

## Installation

No installation is required. Open `public/index.html` directly in a browser, or run `./ask.sh` and choose task `2` for Docker.

## Files

```text
public/index.html            main page
public/js/app.js             generator logic
public/js/main.js            UI initialization, import, and errors
public/js/xlsx.js            browser-side XLSX parser
public/css/app.css           styles
test/generator.test.js       generator tests
test/dynamic_columns.test.js dynamic column tests
test/xlsx.test.js            XLSX parser tests
dockers/                     nginx docker-compose setup
```

## License

This project is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE).

## Add Repository

```bash
git remote add codeberg ssh://git@codeberg.org/veto/textmaker.git
git push codeberg
```

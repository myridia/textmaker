function split_lines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function get_columns() {
  let container = document.getElementById("columns");
  let areas = container.getElementsByTagName("textarea");
  let columns = [];

  for (let i = 0; i < areas.length; i++) {
    let lines = split_lines(areas[i].value);
    if (lines.length > 0) {
      columns.push(lines);
    }
  }

  return columns;
}

function escape_values(columns) {
  return columns.map((column) =>
    column.map((value) => value.replace(/'/g, "''")),
  );
}

function unite_columns(columns) {
  if (columns.length === 0) {
    return [];
  }

  let rows = 0;
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].length > rows) {
      rows = columns[i].length;
    }
  }

  let combined = [];
  for (let i = 0; i < rows; i++) {
    combined[i] = columns.map((column) =>
      column[Math.min(i, column.length - 1)],
    );
  }

  return combined;
}

function make_queries(query, column) {
  let placeholders = (query.match(/\{\}/g) || []).length;

  if (placeholders === 0) {
    return [query];
  }
  if (column.length === 0) {
    return [];
  }

  let available = column[0].length;
  if (placeholders > available) {
    throw new Error(
      "Query has " +
        placeholders +
        " placeholders but only " +
        available +
        " value columns are available.",
    );
  }

  return column.map((values) => {
    let index = 0;
    return query.replace(/\{\}/g, () => values[index++]);
  });
}

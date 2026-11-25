window.onload = () => {
  "use strict";

  let btn = document.querySelector("#btn_create");
  let addBtn = document.querySelector("#btn_add_column");
  let msg = document.getElementById("msg");
  let result = document.getElementById("result");
  let columnBox = document.getElementById("columns");
  let fileInput = document.getElementById("xlsx_file");
  let queryBox = document.getElementById("query");
  let tableBox = document.getElementById("table_name");
  let queryTouched = false;

  function column_letter(index) {
    let value = index + 1;
    let result = "";
    while (value > 0) {
      let remainder = (value - 1) % 26;
      result = String.fromCharCode(97 + remainder) + result;
      value = Math.floor((value - 1) / 26);
    }
    return result;
  }

  function column_label(area, index) {
    let fallback = column_letter(index);
    let label = area.placeholder || "";
    if (!label || label === "Value column " + (index + 1)) {
      return fallback;
    }
    let clean = label
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    return clean || fallback;
  }

  function make_default_query(onlyPopulated) {
    let areas = columnBox.getElementsByTagName("textarea");
    let table = tableBox.value.trim() || "table";
    let names = [];
    let used = {};

    for (let i = 0; i < areas.length; i++) {
      if (onlyPopulated && split_lines(areas[i].value).length === 0) {
        continue;
      }

      let base = column_label(areas[i], i);
      let name = base;
      let suffix = 2;
      while (used[name]) {
        name = base + "_" + suffix;
        suffix += 1;
      }
      used[name] = true;
      names.push(name + "='{}'");
    }

    if (names.length === 0) {
      return "";
    }
    return "UPDATE " + table + " SET " + names.join(",") + ";";
  }

  function refresh_default_query() {
    let areas = Array.from(columnBox.getElementsByTagName("textarea"));
    let hasValues = areas.some((area) => split_lines(area.value).length > 0);
    let generated = make_default_query(hasValues);
    if (!queryTouched) {
      queryBox.value = generated;
    }
  }

  queryBox.addEventListener("input", () => {
    queryTouched = queryBox.value.trim().length > 0;
  });
  columnBox.addEventListener("input", refresh_default_query);
  tableBox.addEventListener("input", refresh_default_query);

  addBtn.addEventListener("click", () => {
    let index = columnBox.getElementsByTagName("textarea").length + 1;
    let wrapper = document.createElement("div");
    let area = document.createElement("textarea");
    let remove = document.createElement("button");

    wrapper.className = "column";
    area.id = "c" + index;
    area.rows = 12;
    area.spellcheck = false;
    area.placeholder = "Value column " + index;
    area.value = "";

    remove.type = "button";
    remove.className = "btn-remove";
    remove.textContent = "×";
    remove.title = "Remove column";
    remove.setAttribute("aria-label", "Remove value column " + index);
    remove.addEventListener("click", () => {
      wrapper.remove();
      refresh_default_query();
    });

    wrapper.append(area, remove);
    columnBox.appendChild(wrapper);
    refresh_default_query();
    area.focus();
  });

  fileInput.addEventListener("change", async () => {
    let file = fileInput.files[0];
    if (!file) {
      return;
    }

    msg.textContent = "";
    msg.className = "";
    result.value = "";

    try {
      let data = await parse_xlsx(file);
      fill_xlsx_data(data);
      refresh_default_query();
      msg.className = "ok";
      msg.textContent =
        "Loaded " +
        data.valueRows.length +
        " rows and " +
        data.valueHeaders.length +
        " columns." +
        (data.hasQuery ? "" : " No query column; kept all columns.");
    } catch (err) {
      msg.textContent = "Could not read XLSX: " + err.message;
    }

    fileInput.value = "";
  });

  btn.addEventListener("click", () => {
    msg.textContent = "";
    msg.className = "";
    result.value = "";

    let columns = get_columns();
    if (columns.length === 0) {
      msg.textContent = "Add values in at least one column.";
      return;
    }

    let query = queryBox.value.trim();
    if (query.length === 0) {
      query = make_default_query(true);
      queryBox.value = query;
      msg.className = "ok";
      msg.textContent = "Query generated from " + columns.length + " columns.";
    }

    try {
      let escaped = escape_values(columns);
      let combined = unite_columns(escaped);
      let queries = make_queries(query, combined);
      result.value = queries.join("\n");
    } catch (err) {
      msg.className = "";
      msg.textContent = err.message;
    }
  });

  refresh_default_query();
};

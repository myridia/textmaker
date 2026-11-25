window.onload = () => {
  "use strict";

  let btn = document.querySelector("#btn_create");
  let msg = document.getElementById("msg");
  let result = document.getElementById("result");

  btn.addEventListener("click", () => {
    msg.textContent = "";
    result.value = "";

    let query = document.getElementById("query").value.trim();
    if (query.length === 0) {
      msg.textContent = "Enter a query template.";
      return;
    }

    let columns = get_columns();
    if (columns.length === 0) {
      msg.textContent = "Add values in at least one column.";
      return;
    }

    try {
      let escaped = escape_values(columns);
      let combined = unite_columns(escaped);
      let queries = make_queries(query, combined);
      result.value = queries.join("\n");
    } catch (err) {
      msg.textContent = err.message;
    }
  });
};

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { create_node, make_value_box } = require("./fake_dom");

const appSource = fs.readFileSync(
  path.join(__dirname, "..", "public", "js", "app.js"),
  "utf8",
);
const source = fs.readFileSync(
  path.join(__dirname, "..", "public", "js", "main.js"),
  "utf8",
);

const columnBox = make_value_box(5);
const addButton = create_node("button");
const createButton = create_node("button");
const xlsxFile = create_node("input");
const msg = create_node("span");
const result = create_node("textarea");
const query = create_node("textarea");
const table = create_node("input");

xlsxFile.files = [];
xlsxFile.value = "";
table.value = "table";

const document = {
  querySelector: (selector) =>
    selector === "#btn_add_column" ? addButton : createButton,
  getElementById: (id) =>
    ({
      msg,
      result,
      query,
      table_name: table,
      columns: columnBox,
      xlsx_file: xlsxFile,
    })[id],
  createElement: (tag) => create_node(tag),
};

const context = { window: {}, document };
vm.createContext(context);
vm.runInContext(appSource, context);
vm.runInContext(source, context);
context.window.onload();

assert.strictEqual(
  query.value,
  "UPDATE table SET a='{}',b='{}',c='{}',d='{}',e='{}';",
);

table.value = "products";
table.handlers.input();
assert.strictEqual(
  query.value,
  "UPDATE products SET a='{}',b='{}',c='{}',d='{}',e='{}';",
);
table.value = "table";
table.handlers.input();

addButton.handlers.click();

let areas = columnBox.getElementsByTagName("textarea");
assert.strictEqual(areas.length, 6);
assert.strictEqual(areas[5].id, "c6");
assert.strictEqual(areas[5].rows, 12);
assert.strictEqual(areas[5].spellcheck, false);
assert.strictEqual(areas[5].placeholder, "Value column 6");
assert.strictEqual(areas[5].focused, true);

let wrapper = columnBox.children[columnBox.children.length - 1];
assert.strictEqual(wrapper.className, "column");
assert.strictEqual(wrapper.children.length, 2);

let remove = wrapper.getElementsByTagName("button")[0];
assert.strictEqual(remove.className, "btn-remove");
assert.strictEqual(remove.textContent, "×");
remove.handlers.click();
assert.strictEqual(columnBox.getElementsByTagName("textarea").length, 5);

query.value = "SELECT 1;";
query.handlers.input();
areas[0].value = "Carol";
columnBox.handlers.input();
assert.strictEqual(query.value, "SELECT 1;");
query.value = "";
query.handlers.input();

areas[0].value = "1\n2";
areas[0].placeholder = "Code";
areas[1].value = "Alice";
areas[1].placeholder = "Full Name";
columnBox.handlers.input();
assert.strictEqual(
  query.value,
  "UPDATE table SET code='{}',full_name='{}';",
);
createButton.handlers.click();

assert.strictEqual(
  query.value,
  "UPDATE table SET code='{}',full_name='{}';",
);
assert.strictEqual(
  result.value,
  "UPDATE table SET code='1',full_name='Alice';\n" +
    "UPDATE table SET code='2',full_name='Alice';",
);

query.value = "UPDATE table SET code='{}' WHERE x='{}';";
query.handlers.input();
createButton.handlers.click();
assert.strictEqual(
  result.value,
  "UPDATE table SET code='1' WHERE x='Alice';\n" +
    "UPDATE table SET code='2' WHERE x='Alice';",
);

console.log("dynamic column tests OK");

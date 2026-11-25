const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "public", "js", "main.js"),
  "utf8",
);

const handlers = {};
const textareas = Array.from({ length: 5 }, (_, index) => ({
  id: "c" + (index + 1),
  value: "",
}));

const columnBox = {
  getElementsByTagName: (tag) => (tag === "textarea" ? textareas : []),
  appendChild: (node) => textareas.push(node),
};

const addButton = {
  addEventListener: (event, handler) => {
    handlers.add = handler;
  },
};

const createButton = {
  addEventListener: (event, handler) => {
    handlers.create = handler;
  },
};

const document = {
  querySelector: (selector) =>
    selector === "#btn_add_column" ? addButton : createButton,
  getElementById: (id) =>
    ({
      msg: { textContent: "" },
      result: { value: "" },
      columns: columnBox,
    })[id],
  createElement: (tag) => ({
    tag,
    id: "",
    rows: 0,
    spellcheck: true,
    placeholder: "",
    value: "",
    focus() {
      this.focused = true;
    },
  }),
};

const context = { window: {}, document };
vm.createContext(context);
vm.runInContext(source, context);
context.window.onload();
handlers.add();

assert.strictEqual(textareas.length, 6);
assert.strictEqual(textareas[5].id, "c6");
assert.strictEqual(textareas[5].rows, 12);
assert.strictEqual(textareas[5].spellcheck, false);
assert.strictEqual(textareas[5].placeholder, "Value column 6");
assert.strictEqual(textareas[5].focused, true);

console.log("dynamic column tests OK");

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "public", "js", "app.js"),
  "utf8",
);

const context = {
  document: {
    getElementById: () => ({
      getElementsByTagName: () => [
        { value: "a'b\nc\r\n\nd" },
        { value: "x\ny" },
        { value: "" },
      ],
    }),
  },
};

vm.createContext(context);
vm.runInContext(source, context);

function same(actual, expected, label) {
  assert.strictEqual(
    JSON.stringify(actual),
    JSON.stringify(expected),
    label + ": " + JSON.stringify(actual),
  );
}

same(
  context.get_columns(),
  [
    ["a'b", "c", "d"],
    ["x", "y"],
  ],
  "get_columns",
);

same(
  context.escape_values([["a'b"], ["x"]]),
  [["a''b"], ["x"]],
  "escape_values",
);

same(
  context.unite_columns([
    ["a", "b"],
    ["x"],
  ]),
  [
    ["a", "x"],
    ["b", "x"],
  ],
  "unite_columns",
);

same(
  context.make_queries("SELECT '{}' AS v, '{}' AS k;", [
    ["a''b", "x"],
    ["c$&d", "y"],
  ]),
  [
    "SELECT 'a''b' AS v, 'x' AS k;",
    "SELECT 'c$&d' AS v, 'y' AS k;",
  ],
  "make_queries",
);

same(context.make_queries("SELECT 1;", [["a"]]), ["SELECT 1;"], "no placeholders");

assert.throws(
  () => context.make_queries("{} {} {}", [["a"]]),
  /placeholders/,
);

console.log("generator tests OK");

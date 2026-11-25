const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { create_node } = require("./fake_dom");

const source = fs.readFileSync(
  path.join(__dirname, "..", "public", "js", "xlsx.js"),
  "utf8",
);

function same(actual, expected, label) {
  assert.strictEqual(
    JSON.stringify(actual),
    JSON.stringify(expected),
    label + ": " + JSON.stringify(actual),
  );
}

function make_zip(files) {
  let encoder = new TextEncoder();
  let localParts = [];
  let centralParts = [];
  let offset = 0;

  for (let [name, text] of Object.entries(files)) {
    let data = encoder.encode(text);
    let nameBytes = encoder.encode(name);
    let local = new Uint8Array(30 + nameBytes.length);
    let localView = new DataView(local.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    localParts.push(local, data);

    centralParts.push({ nameBytes, data, offset });
    offset += local.length + data.length;
  }

  let centralStart = offset;
  let central = [];

  for (let item of centralParts) {
    let record = new Uint8Array(46 + item.nameBytes.length);
    let view = new DataView(record.buffer);

    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint32(20, item.data.length, true);
    view.setUint32(24, item.data.length, true);
    view.setUint16(28, item.nameBytes.length, true);
    view.setUint32(42, item.offset, true);
    record.set(item.nameBytes, 46);
    central.push(record);
  }

  let centralSize = central.reduce((total, record) => total + record.length, 0);
  let end = new Uint8Array(22);
  let endView = new DataView(end.buffer);

  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, central.length, true);
  endView.setUint16(10, central.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralStart, true);

  let parts = [...localParts, ...central, end];
  let output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let position = 0;

  for (let part of parts) {
    output.set(part, position);
    position += part.length;
  }

  return output.buffer;
}

const workbook =
  '<workbook><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>';
const rels =
  '<Relationships><Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/></Relationships>';
const strings =
  "<sst><si><t>Query</t></si><si><t>name</t></si><si><t>date</t></si></sst>";
const sheet =
  '<worksheet><sheetData>' +
  '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>' +
  '<row r="2"><c r="A2" t="inlineStr"><is><t>DELETE FROM t WHERE n = \'{}\' AND d = \'{}\';</t></is></c><c r="B2" t="inlineStr"><is><t>Alice</t></is></c><c r="C2" t="inlineStr"><is><t>2026-11-25</t></is></c></row>' +
  '<row r="3"><c r="B3" t="inlineStr"><is><t>Bob</t></is></c><c r="C3" t="inlineStr"><is><t>2026-11-26</t></is></c></row>' +
  "</sheetData></worksheet>";

(async () => {
  let context = { TextDecoder };
  vm.createContext(context);
  vm.runInContext(source, context);

  let file = {
    name: "values.xlsx",
    arrayBuffer: async () =>
      make_zip({
        "xl/workbook.xml": workbook,
        "xl/_rels/workbook.xml.rels": rels,
        "xl/sharedStrings.xml": strings,
        "xl/worksheets/sheet1.xml": sheet,
      }),
  };

  let data = await context.parse_xlsx(file);
  assert.strictEqual(data.query, "DELETE FROM t WHERE n = '{}' AND d = '{}';");
  same(data.valueHeaders, ["name", "date"], "valueHeaders");
  same(
    data.valueRows,
    [
      ["Alice", "2026-11-25"],
      ["Bob", "2026-11-26"],
    ],
    "valueRows",
  );

  let queryBox = create_node("textarea");
  let resultBox = create_node("textarea");
  let columnBox = create_node("div");

  context.document = {
    getElementById: (id) =>
      ({
        query: queryBox,
        result: resultBox,
        columns: columnBox,
      })[id],
    createElement: (tag) => create_node(tag),
  };

  context.fill_xlsx_data(data);
  assert.strictEqual(queryBox.value, data.query);
  assert.strictEqual(resultBox.value, "");
  assert.strictEqual(columnBox.children.length, 5);

  let areas = columnBox.getElementsByTagName("textarea");
  assert.strictEqual(areas.length, 5);
  assert.strictEqual(areas[0].value, "Alice\nBob");
  assert.strictEqual(areas[0].placeholder, "name");
  assert.strictEqual(areas[1].value, "2026-11-25\n2026-11-26");
  assert.strictEqual(columnBox.getElementsByClassName("btn-remove").length, 5);

  columnBox.children = [];
  context.fill_xlsx_data({
    query: "SELECT '{}';",
    valueHeaders: ["a", "b", "c", "d", "e", "f", "g"],
    valueRows: [["1", "2", "3", "4", "5", "6", "7"]],
  });
  assert.strictEqual(columnBox.children.length, 7);

  let noQuery = context.pick_xlsx_data([
    ["id", "category", "sec"],
    ["1", "books", "/a"],
  ]);
  assert.strictEqual(noQuery.query, "");
  same(noQuery.valueHeaders, ["id", "category", "sec"], "noQuery valueHeaders");
  same(noQuery.valueRows, [["1", "books", "/a"]], "noQuery valueRows");
  assert.strictEqual(noQuery.hasQuery, false);

  queryBox.value = "KEEP THIS QUERY";
  context.fill_xlsx_data({
    query: "",
    valueHeaders: ["id", "category"],
    valueRows: [["1", "books"]],
  });
  assert.strictEqual(queryBox.value, "KEEP THIS QUERY");

  let workbook2 =
    '<workbook><sheets><sheet name="Data" r:id="rId1"/><sheet name="Import" r:id="rId2"/></sheets></workbook>';
  let rels2 =
    '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>';
  let sheet2a =
    '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>first</t></is></c></row></sheetData></worksheet>';
  let sheet2b =
    '<worksheet><sheetData>' +
    '<row r="1"><c r="A1" t="inlineStr"><is><t>statement</t></is></c><c r="B1" t="inlineStr"><is><t>name</t></is></c></row>' +
    '<row r="2"><c r="A2" t="inlineStr"><is><t>SELECT \'{}\';</t></is></c><c r="B2" t="inlineStr"><is><t>Alice</t></is></c></row>' +
    "</sheetData></worksheet>";

  let file2 = {
    name: "multi.xlsx",
    arrayBuffer: async () =>
      make_zip({
        "xl/workbook.xml": workbook2,
        "xl/_rels/workbook.xml.rels": rels2,
        "xl/worksheets/sheet1.xml": sheet2a,
        "xl/worksheets/sheet2.xml": sheet2b,
      }),
  };

  let data2 = await context.parse_xlsx(file2);
  assert.strictEqual(data2.query, "SELECT '{}';");
  same(data2.valueHeaders, ["name"], "second sheet valueHeaders");
  same(data2.valueRows, [["Alice"]], "second sheet valueRows");
  assert.strictEqual(data2.hasQuery, true);

  console.log("xlsx tests OK");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

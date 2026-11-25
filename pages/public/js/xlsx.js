function decode_xml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&");
}

function attr(attrs, name) {
  let match = attrs.match(new RegExp("\\b" + name + "\\s*=\\s*\"([^\"]*)\""));
  if (!match) {
    match = attrs.match(new RegExp("\\b" + name + "\\s*=\\s*'([^']*)'"));
  }
  return match ? decode_xml(match[1]) : "";
}

function xml_text(bytes) {
  return bytes ? new TextDecoder().decode(bytes) : "";
}

async function inflate_raw(bytes) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress xlsx files");
  }
  let stream = new Blob([bytes]).stream();
  stream = stream.pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function find_eocd(view) {
  let start = Math.max(0, view.byteLength - 65557);
  for (let i = view.byteLength - 22; i >= start; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      return i;
    }
  }
  throw new Error("Not a valid xlsx file");
}

function read_zip(buffer) {
  let view = new DataView(buffer);
  let eocd = find_eocd(view);
  let count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  let entries = {};

  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("Bad xlsx archive structure");
    }

    let method = view.getUint16(offset + 10, true);
    let compressedSize = view.getUint32(offset + 20, true);
    let nameLength = view.getUint16(offset + 28, true);
    let extraLength = view.getUint16(offset + 30, true);
    let commentLength = view.getUint16(offset + 32, true);
    let localOffset = view.getUint32(offset + 42, true);
    let name = xml_text(new Uint8Array(buffer, offset + 46, nameLength));

    entries[name] = { method, compressedSize, localOffset };
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return { buffer, view, entries };
}

async function read_entry(zip, name) {
  let entry = zip.entries[name];
  if (!entry) {
    return null;
  }

  let offset = entry.localOffset;
  if (zip.view.getUint32(offset, true) !== 0x04034b50) {
    throw new Error("Bad xlsx entry: " + name);
  }

  let nameLength = zip.view.getUint16(offset + 26, true);
  let extraLength = zip.view.getUint16(offset + 28, true);
  let start = offset + 30 + nameLength + extraLength;
  let bytes = new Uint8Array(zip.buffer, start, entry.compressedSize);

  if (entry.method === 0) {
    return bytes;
  }
  if (entry.method === 8) {
    return inflate_raw(bytes);
  }
  throw new Error("Unsupported xlsx compression: " + entry.method);
}

function normalize_target(target) {
  let parts = String(target).replace(/\\/g, "/").split("/");
  let result = [];

  for (let part of parts) {
    if (!part || part === ".") {
      continue;
    }
    if (part === "..") {
      result.pop();
      continue;
    }
    result.push(part);
  }

  let path = result.join("/");
  return path.startsWith("xl/") ? path : "xl/" + path;
}

function sheet_paths(workbookXml, relsXml) {
  let sheetRe = /<(?:[A-Za-z0-9_]+:)?sheet\b([^>]*)\/?>/g;
  let relRe = /<(?:[A-Za-z0-9_]+:)?Relationship\b([^>]*)\/?>/g;
  let rels = {};
  let match;

  while ((match = relRe.exec(relsXml || ""))) {
    let id = attr(match[1], "Id");
    let target = attr(match[1], "Target");
    if (id && target) {
      rels[id] = normalize_target(target);
    }
  }

  let paths = [];
  while ((match = sheetRe.exec(workbookXml))) {
    let id = attr(match[1], "r:id") || attr(match[1], "id");
    paths.push(rels[id] || "xl/worksheets/sheet1.xml");
  }

  if (paths.length === 0) {
    throw new Error("No worksheet found");
  }

  return paths;
}

function parse_shared_strings(xml) {
  let result = [];
  let siRe =
    /<(?:[A-Za-z0-9_]+:)?si\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_]+:)?si>|<(?:[A-Za-z0-9_]+:)?si\b[^>]*\/>/g;
  let tRe =
    /<(?:[A-Za-z0-9_]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_]+:)?t>|<(?:[A-Za-z0-9_]+:)?t\b[^>]*\/>/g;
  let match;

  while ((match = siRe.exec(xml))) {
    let text = "";
    tRe.lastIndex = 0;
    let inner;
    while ((inner = tRe.exec(match[1] || ""))) {
      text += decode_xml(inner[1] || "");
    }
    result.push(text);
  }

  return result;
}

function tag_value(body, name) {
  let pattern =
    "<(?:[A-Za-z0-9_]+:)?" +
    name +
    "\\b[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_]+:)?" +
    name +
    ">|<(?:[A-Za-z0-9_]+:)?" +
    name +
    "\\b[^>]*\\/>";
  let match = new RegExp(pattern).exec(body);
  return match ? decode_xml(match[1] || "") : "";
}

function cell_value(attrs, body, shared) {
  let type = attr(attrs, "t");

  if (type === "inlineStr") {
    let text = "";
    let tRe =
      /<(?:[A-Za-z0-9_]+:)?t\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_]+:)?t>|<(?:[A-Za-z0-9_]+:)?t\b[^>]*\/>/g;
    let match;
    while ((match = tRe.exec(body))) {
      text += decode_xml(match[1] || "");
    }
    return text;
  }

  let value = tag_value(body, "v");
  if (type === "s") {
    return shared[parseInt(value, 10)] || "";
  }
  if (type === "b") {
    return value === "1" ? "TRUE" : "FALSE";
  }
  return value;
}

function column_index(ref) {
  let upper = String(ref).toUpperCase();
  let result = 0;

  for (let i = 0; i < upper.length; i++) {
    let code = upper.charCodeAt(i);
    if (code < 65 || code > 90) {
      break;
    }
    result = result * 26 + (code - 64);
  }

  return Math.max(0, result - 1);
}

function row_number(ref) {
  let match = String(ref).match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
}

function col_letter(index) {
  let value = index + 1;
  let result = "";

  while (value > 0) {
    let remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }

  return result;
}

function parse_sheet(xml, shared) {
  let cells = {};
  let maxRow = 0;
  let maxCol = 0;
  let cRe =
    /<(?:[A-Za-z0-9_]+:)?c\b([^>]*?)>([\s\S]*?)<\/(?:[A-Za-z0-9_]+:)?c>|<(?:[A-Za-z0-9_]+:)?c\b([^>]*?)\/>/g;
  let match;

  while ((match = cRe.exec(xml))) {
    let attrs = match[1] || match[3] || "";
    let body = match[2] || "";
    let ref = attr(attrs, "r").toUpperCase();
    if (!ref) {
      continue;
    }

    let col = column_index(ref);
    let row = row_number(ref);
    cells[ref] = cell_value(attrs, body, shared);
    if (row > maxRow) {
      maxRow = row;
    }
    if (col > maxCol) {
      maxCol = col;
    }
  }

  let rows = [];
  for (let r = 1; r <= maxRow; r++) {
    let row = [];
    for (let c = 0; c <= maxCol; c++) {
      row.push(cells[col_letter(c) + r] || "");
    }
    rows.push(row);
  }

  return rows;
}

function pick_xlsx_data(rows) {
  if (rows.length === 0) {
    throw new Error("Sheet is empty");
  }

  let headers = rows[0].map((value) => String(value || "").trim());
  let queryIndex = headers.findIndex((header) => {
    let key = header.toLowerCase().trim();
    return (
      key.includes("query") ||
      key.includes("template") ||
      key === "sql" ||
      key === "text" ||
      key === "statement" ||
      key === "command" ||
      key.startsWith("sql") ||
      key.startsWith("text") ||
      key.startsWith("statement") ||
      key.startsWith("command")
    );
  });

  let query = "";
  if (queryIndex >= 0) {
    for (let r = 1; r < rows.length; r++) {
      let value = String(rows[r][queryIndex] || "").trim();
      if (value) {
        query = value;
        break;
      }
    }

    if (!query) {
      throw new Error("The query column has no value");
    }
  }

  let valueIndexes = [];
  for (let c = 0; c < headers.length; c++) {
    if (c === queryIndex) {
      continue;
    }
    if (rows.slice(1).some((row) => String(row[c] || "").length > 0)) {
      valueIndexes.push(c);
    }
  }

  if (valueIndexes.length === 0) {
    throw new Error("No value columns found");
  }

  let valueHeaders = valueIndexes.map(
    (c, index) => headers[c] || "Column " + (index + 1),
  );
  let valueRows = [];

  for (let r = 1; r < rows.length; r++) {
    let row = valueIndexes.map((c) => String(rows[r][c] || ""));
    if (row.some((value) => value.length > 0)) {
      valueRows.push(row);
    }
  }

  if (valueRows.length === 0) {
    throw new Error("No value rows found");
  }

  return { query, valueHeaders, valueRows, hasQuery: queryIndex >= 0 };
}

async function parse_xlsx(file) {
  if (!/\.xlsx$/i.test(file.name || "")) {
    throw new Error("Choose an .xlsx file");
  }

  let zip = read_zip(await file.arrayBuffer());
  let workbookXml = xml_text(await read_entry(zip, "xl/workbook.xml"));
  if (!workbookXml) {
    throw new Error("Missing workbook.xml");
  }

  let relsXml = xml_text(await read_entry(zip, "xl/_rels/workbook.xml.rels"));
  let paths = sheet_paths(workbookXml, relsXml);
  let shared = parse_shared_strings(
    xml_text(await read_entry(zip, "xl/sharedStrings.xml")),
  );
  let lastError = null;

  for (let path of paths) {
    let sheetXml = xml_text(await read_entry(zip, path));
    if (!sheetXml) {
      continue;
    }

    let rows = parse_sheet(sheetXml, shared);
    try {
      return pick_xlsx_data(rows);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("No readable worksheet found");
}

function fill_xlsx_data(data) {
  if (data.query) {
    document.getElementById("query").value = data.query;
  }
  document.getElementById("result").value = "";

  let box = document.getElementById("columns");
  box.innerHTML = "";

  let count = Math.max(5, data.valueHeaders.length);
  for (let c = 0; c < count; c++) {
    let wrapper = document.createElement("div");
    let area = document.createElement("textarea");
    let remove = document.createElement("button");
    let values = [];

    wrapper.className = "column";
    area.id = "c" + (c + 1);
    area.rows = 12;
    area.spellcheck = false;

    for (let r = 0; r < data.valueRows.length; r++) {
      values.push(data.valueRows[r][c] || "");
    }
    area.value = values.join("\n");

    let header = data.valueHeaders[c] || "";
    if (header) {
      area.placeholder = header;
      area.title = header;
      area.setAttribute("aria-label", header);
    }

    remove.type = "button";
    remove.className = "btn-remove";
    remove.textContent = "×";
    remove.title = "Remove column";
    remove.setAttribute("aria-label", "Remove value column " + (c + 1));
    remove.addEventListener("click", () => wrapper.remove());

    wrapper.append(area, remove);
    box.appendChild(wrapper);
  }
}

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "components", "ChinaLocationFields.tsx"),
  "utf8"
);

test("city selection label uses the correct singular and plural words", () => {
  assert.match(source, /cities\.length === 1[\s\S]*?\? "1 city selected"/);
  assert.match(source, /`\$\{cities\.length\} cities selected`/);
  assert.doesNotMatch(source, /city\$\{cities\.length > 1 \? "ies" : "y"\}/);
});

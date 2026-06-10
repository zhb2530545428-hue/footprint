const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("homepage content does not duplicate the top navigation New Journey action", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "app", "page.tsx"),
    "utf8"
  );

  assert.equal(source.includes('href="/journeys/new"'), false);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("places mode renders city groups on a location axis", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "components", "PlaceJourneyGroups.tsx"),
    "utf8"
  );

  assert.equal(source.includes('data-place-axis="true"'), true);
});

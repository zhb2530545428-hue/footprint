const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const { groupTimelineGroupsByYear } = require("../lib/browseModes.ts");

test("nests months under one entry per timeline year", () => {
  const groups = [
    { year: 2026, month: 6, monthName: "June", journeys: [] },
    { year: 2026, month: 4, monthName: "April", journeys: [] },
    { year: 2025, month: 11, monthName: "November", journeys: [] },
  ];

  const years = groupTimelineGroupsByYear(groups);

  assert.deepEqual(
    years.map((year) => ({
      year: year.year,
      months: year.months.map((month) => month.monthName),
    })),
    [
      { year: 2026, months: ["June", "April"] },
      { year: 2025, months: ["November"] },
    ]
  );
});

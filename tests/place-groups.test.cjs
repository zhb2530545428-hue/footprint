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

const { groupJourneysByProvinceCity } = require("../lib/browseModes.ts");

test("places a multi-city journey under every unique valid city", () => {
  const journey = {
    id: "multi-city",
    location: "辽宁",
    locationProvince: "辽宁",
    locationCities: ["", "大连", "鞍山", "大连"],
    companions: [],
    photos: [],
    categories: [],
    status: "archived",
    createdAt: "2026-04-10T00:00:00Z",
    updatedAt: "2026-04-10T00:00:00Z",
  };

  const result = groupJourneysByProvinceCity([journey]);

  assert.deepEqual(
    result.groups[0].cities.map((city) => ({
      city: city.city,
      journeyIds: city.journeys.map((item) => item.id),
    })),
    [
      { city: "大连", journeyIds: ["multi-city"] },
      { city: "鞍山", journeyIds: ["multi-city"] },
    ]
  );
});

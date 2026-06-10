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

const { computeFloatingCardPosition } = require("../lib/note-tooltip-position.ts");

test("keeps a short note card near the cursor when it fits below", () => {
  const position = computeFloatingCardPosition({
    cursorX: 700,
    cursorY: 700,
    cardWidth: 360,
    cardHeight: 72,
    viewportWidth: 2048,
    viewportHeight: 988,
  });

  assert.deepEqual(position, { left: 716, top: 716 });
});

test("places the note card above the cursor only when its measured height would overflow", () => {
  const position = computeFloatingCardPosition({
    cursorX: 700,
    cursorY: 940,
    cardWidth: 360,
    cardHeight: 72,
    viewportWidth: 2048,
    viewportHeight: 988,
  });

  assert.deepEqual(position, { left: 716, top: 852 });
});

test("keeps the measured card inside the viewport margins", () => {
  const position = computeFloatingCardPosition({
    cursorX: 10,
    cursorY: 10,
    cardWidth: 360,
    cardHeight: 568,
    viewportWidth: 390,
    viewportHeight: 600,
  });

  assert.deepEqual(position, { left: 16, top: 16 });
});

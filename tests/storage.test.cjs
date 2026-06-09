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

function makeJourney(url) {
  const now = new Date().toISOString();
  return {
    id: "journey-1",
    location: "Kyoto",
    companions: [],
    status: "archived",
    coverPhotoId: "photo-1",
    photos: [
      {
        id: "photo-1",
        url,
        storageKey: "photo-1",
        fileName: "photo.jpg",
        isCover: true,
        isHighlight: false,
        hasNote: false,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function loadStorage() {
  delete require.cache[require.resolve("../lib/storage.ts")];
  return require("../lib/storage.ts");
}

test("saveJourney keeps transient image URLs out of localStorage", async () => {
  let stored = "";
  global.window = {};
  global.localStorage = {
    getItem: () => null,
    setItem: (_key, value) => {
      stored = value;
    },
  };

  const { saveJourney } = loadStorage();
  await saveJourney(makeJourney("blob:http://localhost/photo-1"));

  assert.equal(stored.includes("blob:"), false);
  assert.equal(JSON.parse(stored)[0].photos[0].url, "");
  assert.equal(JSON.parse(stored)[0].photos[0].storageKey, "photo-1");
});

test("saveJourney keeps remote image URLs as metadata", async () => {
  let stored = "";
  global.window = {};
  global.localStorage = {
    getItem: () => null,
    setItem: (_key, value) => {
      stored = value;
    },
  };

  const { saveJourney } = loadStorage();
  const remoteUrl = "https://images.example/photo.jpg";
  await saveJourney(makeJourney(remoteUrl));

  assert.equal(JSON.parse(stored)[0].photos[0].url, remoteUrl);
});

test("saveJourney strips legacy base64 image data from localStorage", async () => {
  let stored = "";
  global.window = {};
  global.localStorage = {
    getItem: () => null,
    setItem: (_key, value) => {
      stored = value;
    },
  };

  const { saveJourney } = loadStorage();
  await saveJourney(makeJourney("data:image/png;base64,aGVsbG8="));

  assert.equal(stored.includes("data:image"), false);
  assert.equal(JSON.parse(stored)[0].photos[0].storageKey, "photo-1");
});

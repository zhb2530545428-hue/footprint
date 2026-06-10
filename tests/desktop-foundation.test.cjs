const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("desktop upload can call writeFile for temporary photos inside app data", () => {
  const capabilities = JSON.parse(
    read(path.join("src-tauri", "capabilities", "default.json"))
  );
  const appDataScope = capabilities.permissions.find(
    (permission) =>
      typeof permission === "object" && permission.identifier === "fs:scope"
  );

  assert.ok(appDataScope, "missing fs:scope permission");
  assert.ok(
    appDataScope.allow.some(({ path: allowedPath }) =>
      allowedPath.startsWith("$APPDATA/")
    ),
    "fs:scope must allow the app data directory used for temporary uploads"
  );
  assert.ok(
    capabilities.permissions.includes("fs:allow-write-file"),
    "writeFile invokes fs.write_file and requires fs:allow-write-file"
  );
});

test("desktop enables the asset protocol for saved Library photos", () => {
  const config = JSON.parse(read(path.join("src-tauri", "tauri.conf.json")));

  assert.equal(config.app.security.assetProtocol.enable, true);
  assert.ok(Array.isArray(config.app.security.assetProtocol.scope));
});

test("desktop scopes the selected Library for local photo display", () => {
  const rustSource = read(path.join("src-tauri", "src", "lib.rs"));
  const bridgeSource = read(path.join("lib", "desktop", "tauri-bridge.ts"));
  const shellSource = read(path.join("components", "AppShell.tsx"));

  assert.match(rustSource, /fn allow_library_path/);
  assert.match(rustSource, /asset_protocol_scope\(\)[\s\S]*?\.allow_directory/);
  assert.match(bridgeSource, /export async function allow_library_path/);
  assert.match(shellSource, /await allow_library_path\(savedPath\)/);
});

test("desktop categories are isolated per journey and saved before photos", () => {
  const schemaSource = read(path.join("lib", "desktop", "schema.ts"));
  const repoSource = read(
    path.join("lib", "data", "desktopLibraryRepository.ts")
  );

  assert.match(schemaSource, /PRIMARY KEY \(journey_id, id\)/);
  assert.match(
    schemaSource,
    /FOREIGN KEY \(journey_id, category_id\) REFERENCES photo_categories\(journey_id, id\)/
  );

  const categoriesIndex = repoSource.indexOf("// Save categories");
  const photosIndex = repoSource.indexOf("// Save photos");
  assert.ok(categoriesIndex >= 0);
  assert.ok(photosIndex >= 0);
  assert.ok(categoriesIndex < photosIndex, "categories must be saved before photos");
});

test("edit journey uses the active repositories in browser and desktop modes", () => {
  const source = read(path.join("app", "journeys", "[id]", "edit", "page.tsx"));

  assert.match(source, /getJourneyRepo/);
  assert.match(source, /getPhotoRepo/);
  assert.doesNotMatch(source, /from "@\/lib\/image-storage"/);
  assert.doesNotMatch(source, /\n\s+getJourney,\n/);
  assert.doesNotMatch(source, /\n\s+updateJourney,\n/);
  assert.doesNotMatch(source, /\n\s+moveJourneyToTrash,\n/);
});

test("desktop photo saves carry their Library-relative path into journey updates", () => {
  const source = read(
    path.join("lib", "data", "desktopLibraryRepository.ts")
  );

  assert.match(source, /_relativePath: relativePath/);
  assert.match(source, /getRelativePhotoPath/);
  assert.doesNotMatch(source, /const isWebUrl =/);
});

test("desktop settings are hydrated and cached after reopening a Library", () => {
  const repoSource = read(
    path.join("lib", "data", "desktopLibraryRepository.ts")
  );
  const shellSource = read(path.join("components", "AppShell.tsx"));

  assert.match(repoSource, /let cachedDesktopSettings/);
  assert.match(repoSource, /cachedDesktopSettings = copySettings\(settings\)/);
  assert.match(repoSource, /cachedDesktopSettings = loaded/);
  assert.match(shellSource, /await loadDesktopSettings\(\)/);
});

test("desktop Library does not seed browser demo journeys", () => {
  const source = read(path.join("app", "page.tsx"));

  assert.match(source, /getDataMode/);
  assert.match(source, /getDataMode\(\) === "browser"/);
});

test("new journey keeps previews on failure and cleans copied photos", () => {
  const source = read(path.join("app", "journeys", "new", "page.tsx"));
  const saveIndex = source.indexOf("await getJourneyRepo().saveJourney(journey)");
  const revokeIndex = source.indexOf("getPhotoRepo().revokeObjectUrls(finalPhotos)");

  assert.ok(saveIndex >= 0);
  assert.ok(revokeIndex > saveIndex, "preview URLs must only be revoked after save succeeds");
  assert.match(source, /deleteAllPhotosForJourney\(journeyId\)/);
});

test("category updates do not replace rows referenced by photos", () => {
  const source = read(
    path.join("lib", "data", "desktopLibraryRepository.ts")
  );

  assert.match(source, /ON CONFLICT\(journey_id, id\) DO UPDATE/);
});

test("permanent delete warning is accurate in browser and desktop modes", () => {
  const source = read(path.join("app", "trash", "page.tsx"));

  assert.doesNotMatch(source, /browser storage/);
  assert.match(source, /local storage/);
});

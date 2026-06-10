# Footprint v1.8 China Province + Multi-city Location Fields — Claude Code Prompt

## 0. How to use this file

Put this file in the project root of the Footprint repository, then open Claude Code from the repo root and say:

```text
请阅读项目根目录里的 FOOTPRINT_V1_8_CHINA_LOCATION_FIELDS_PROMPT.md，然后按照里面的要求实现 Footprint v1.8。

这次只做中国省份 + 多城市 + 具体地址选填的结构化地点输入，不要扩大范围，不要提前实现 backlog 功能。

特别注意：
1. 省份是单选。
2. 城市是多选。
3. 具体地址是选填，不是必填。
4. 如果用户切换省份，已选择的所有城市必须自动清空。

完成后运行 npm run lint、npm run typecheck、npm run build，并修复所有错误。
```

Repository:

```text
https://github.com/zhb2530545428-hue/footprint.git
```

---

## 1. Product context

Footprint is a personal travel photo memory app.

It should feel:

```text
calm
personal
memory-first
photo-first
low-density
Airbnb-inspired
not an admin dashboard
not a social album
```

The user is satisfied with versions up to v1.7:

```text
v1: Basic Journey flow
v1.1: Local image persistence and editing
v1.2: Trash & Safe Delete
v1.3: Settings & Home Polish
v1.4: Custom Categories & Manual Organization
v1.4.1: Category Polish
v1.5: Photo Notes Polish, including Apple-like hover note card
v1.6: Journey Detail Memory Polish
v1.7: Edit Journey Curation Polish
```

Now implement:

```text
v1.8 China Province + Multi-city Location Fields
```

One-sentence goal:

```text
Replace the free-text Journey location input with China-only structured fields: one province, multiple cities, and an optional detailed place/address.
```

Chinese product goal:

```text
把 Journey 的地点从自由文本输入，改成中国省份单选 + 城市多选 + 具体地址选填，为未来按地点浏览旅行相册打基础。
```

---

## 2. Important user request

The user specifically requested:

```text
旅程的编辑地址栏做成下拉菜单可以选择的。
目前只做中国。
先选择省份。
一个省份里可能不止玩一个城市，所以城市应该支持多选。
具体地址单独一行，用户自己手动填写。
具体地址不是必填。
如果切换省份，已选择的所有城市必须自动清空。
未来首页可以按时间轴或地点排列，但这一版不要做，只列入长期计划。
```

The most important behaviors:

```text
1. Province is single-select.
2. Cities are multi-select.
3. Detailed address / detailed place is optional and must not block saving.
4. When province changes, all selected cities must be cleared automatically.
```

Do not miss these.

---

## 3. Scope of v1.8

This version only changes Journey location input and related data handling.

Implement the new location form in:

```text
New Journey page / form
Edit Journey page / form
```

The new location UI should have three parts:

```text
Province / 省份 *
Cities / 城市 *
Detailed address / 具体地址（选填）
```

Behavior:

```text
1. User selects one province first.
2. Cities selector is disabled or empty until a province is selected.
3. After selecting a province, city options show only cities under that province.
4. User can select multiple cities under the selected province.
5. Selected cities should be visible as chips/tags or another clear low-density selected state.
6. User can remove a selected city.
7. If user changes province, all selected cities are automatically cleared.
8. Detailed address is a separate manual text input.
9. Province and at least one city are required.
10. Detailed address is optional.
11. Only China is supported in this version.
```

---

## 4. Must not do

Do not implement:

```text
multi-province journeys
route stop list
homepage location grouping
homepage timeline
timeline view
map
GPS
geocoding
auto location detection
address autocomplete
province/city search
Baidu Maps API
Amap / 高德 API
Google Maps API
foreign country support
AI address parsing
AI trip organization
export
share
save as work
real backend
login
cloud storage
public sharing
statistics dashboard
```

Especially:

```text
Do not implement Home grouping by location in v1.8.
Do not implement Home timeline in v1.8.
Do not implement multi-province trips in v1.8.
```

Those are future backlog items only.

This version should only create the structured location foundation.

---

## 5. Long-term backlog note

The following ideas are long-term backlog only:

```text
Future Home browsing can support:
1. timeline-based arrangement
2. location-based arrangement
3. multi-province / route-based journeys
4. map view
```

Do not implement these in this version.

If there is already a docs/changelog pattern, you may record them briefly there. If not, skip documentation and keep this version focused.

---

## 6. Existing behavior to preserve

Preserve all current completed behavior:

```text
New Journey still works.
Edit Journey still works.
Journey Detail still displays location.
Home cards still display location if Settings allow it.
Settings still control Home card field visibility.
LocalStorage journey metadata remains compatible.
IndexedDB image persistence remains untouched.
Photo upload remains untouched.
Cover selection remains untouched.
Highlights remain untouched.
Custom categories remain untouched.
Photo notes remain untouched.
Trash & Safe Delete remains untouched.
```

Do not regress v1.5/v1.6/v1.7 behavior.

---

## 7. Data model guidance

The app currently likely has a `location` string field.

Do not delete the existing `location` field, because old Journeys may rely on it.

Add optional structured fields to the Journey model.

Recommended fields:

```ts
locationCountry?: "China";
locationProvince?: string;
locationCities?: string[];
locationCity?: string; // compatibility: first selected city, if needed by existing code
locationAddress?: string;
location?: string; // display-compatible string
```

Important:

```text
New code should prefer locationCities for multi-city support.
locationCity may be kept as a compatibility field and can mirror the first selected city.
Do not rely only on locationCity for new multi-city behavior.
```

When saving a Journey with the new China fields, build `location` from structured fields.

Recommended display formatting:

```text
Province · City1 / City2 / City3 · Detailed address
```

Examples:

```text
北京 · 北京 · 朝阳区望京街道
浙江 · 杭州 / 湖州 · 西湖区、南浔古镇
四川 · 成都 / 乐山 / 阿坝
云南 · 昆明 / 大理 / 丽江 · 洱海、丽江古城
```

If no detailed address exists:

```text
Province · City1 / City2 / City3
```

Do not include empty separators.

Implementation can use a helper function, for example:

```ts
export function formatJourneyLocation(input: {
  province?: string;
  cities?: string[];
  city?: string;
  address?: string;
  fallback?: string;
}) {
  const cityNames = input.cities?.length
    ? input.cities
    : input.city
      ? [input.city]
      : [];

  const cityText = cityNames
    .map((city) => city.trim())
    .filter(Boolean)
    .join(" / ");

  const parts = [input.province, cityText, input.address]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : input.fallback?.trim() ?? "";
}
```

Use existing project conventions if a helper file already exists.

---

## 8. Backward compatibility

Existing Journeys may have only:

```ts
location: "Kyoto, Japan"
```

or:

```ts
location: "Beijing"
```

or previous v1.8 test data with:

```ts
locationProvince: "浙江";
locationCity: "杭州";
```

Do not break them.

Required behavior for old data:

```text
Old Journeys still display their existing location string on Home and Journey Detail.
Old Journeys can still be opened.
Old Journeys can still be edited.
If an old Journey has no structured province/city fields, do not crash.
If a Journey has old single `locationCity`, use it as initial selected city unless `locationCities` exists.
```

In the Edit Journey form, for old Journeys:

Preferred behavior:

```text
Show the new province/cities/address fields empty if no structured data exists.
If the old location string exists, show a small quiet note:
"Existing location: Kyoto, Japan"
or preserve it as fallback display until the user chooses a China province and cities.
```

But keep it calm.

Do not create a complex migration screen.

Do not try to parse old free-text locations.

Once the user selects province + one or more cities and saves, structured fields should take over and the `location` display string should be generated from them.

---

## 9. China province/city data

Create a small static local data file.

Suggested file:

```text
lib/chinaLocations.ts
```

Suggested shape:

```ts
export type ChinaProvince = {
  name: string;
  cities: string[];
};

export const CHINA_PROVINCES: ChinaProvince[] = [
  {
    name: "北京",
    cities: ["北京"],
  },
  {
    name: "上海",
    cities: ["上海"],
  },
  // ...
];
```

Use Chinese names for province and city options.

Keep this static and local.

Do not fetch data from an API.

Do not add new dependencies.

### 9.1 Required province-level coverage

Include China province-level regions commonly used in address selection:

```text
北京
天津
河北
山西
内蒙古
辽宁
吉林
黑龙江
上海
江苏
浙江
安徽
福建
江西
山东
河南
湖北
湖南
广东
广西
海南
重庆
四川
贵州
云南
西藏
陕西
甘肃
青海
宁夏
新疆
香港
澳门
台湾
```

For municipalities, use one city with the same name:

```text
北京 -> 北京
天津 -> 天津
上海 -> 上海
重庆 -> 重庆
```

For Hong Kong, Macau, and Taiwan, use a simple pragmatic city list sufficient for this app.

This project is a personal memory app, not a government address registry.

Do not over-engineer administrative divisions.

### 9.2 City list quality

Aim to include normal prefecture-level cities for mainland provinces.

The list does not need county/district/street-level detail.

Detailed address / detailed place is manually entered in a separate optional field.

If unsure about a small number of city names, prefer a simple maintainable list and avoid blocking the implementation.

Do not add a huge third-party package for this.

---

## 10. UI design requirements

The new location area should replace the old single text input.

Current UI roughly has:

```text
Location *
[e.g. Kyoto, Japan]
```

Replace it with:

```text
Province *
[Select province]

Cities *
[Select one or more cities]
[杭州] [湖州] [宁波]

Detailed address
[e.g. 西湖区 / 南浔古镇 / 酒店附近]   optional
```

The UI should match Footprint's calm style:

```text
white background
large rounded inputs
subtle borders
clean labels
comfortable spacing
low-density layout
warm orange selected state
```

Do not make it look like a bureaucratic form.

### 10.1 New Journey layout

On the New Journey page/form:

```text
Province and Cities can be shown side by side on desktop if it remains readable.
On mobile, stack them vertically.
Detailed address should be its own full-width row below them.
Detailed address should be clearly optional.
```

Example desktop layout:

```text
Province *             Cities *
[Select province]      [Select cities]

Selected cities:
[杭州] [湖州] [宁波]

Detailed address（optional）
[Optional detail...]
```

### 10.2 Edit Journey layout

The same location component should be used or visually matched in Edit Journey.

Do not let New and Edit diverge.

Prefer extracting a reusable component, for example:

```text
components/ChinaLocationFields.tsx
```

Only create it if it fits the current structure.

---

## 11. Detailed interaction rules

### 11.1 Province select

Initial placeholder:

```text
Select province
```

When selected:

```text
state.locationProvince = selectedProvince
state.locationCountry = "China"
state.locationCities = []
state.locationCity = ""
```

Important:

```text
Changing province must clear all selected cities.
```

Do not keep stale cities from the previous province.

Example:

```text
User selects 浙江.
User selects 杭州 and 湖州.
User changes province to 四川.
Selected cities must become empty.
City options must now show 四川 cities.
```

### 11.2 Cities multi-select

Before province selected:

```text
disabled
placeholder: Select province first
```

After province selected:

```text
enabled
placeholder: Select cities
options: selected province's cities only
```

Cities are required:

```text
At least one city must be selected before create/save.
```

The UI can be implemented as:

```text
checkbox dropdown
multi-select popover
select + add button
clickable city chips
simple checkbox list
```

Choose the simplest implementation that fits the existing UI and avoids new dependencies.

Selected cities should be visible and removable.

Recommended selected city visual:

```text
small rounded chip
city name
small remove x
warm subtle selected state
```

Do not make the selected city chips visually loud.

### 11.3 Detailed address / detailed place

This is a manual text field.

It is optional.

Placeholder examples:

```text
e.g. 洱海、丽江古城、香格里拉路线上
e.g. 西湖区民宿附近
e.g. 春熙路附近
```

Detailed address must not be required.

Do not validate it heavily.

Trim whitespace on save.

If empty, save as empty string or undefined according to existing project convention.

### 11.4 Save behavior

When saving:

```text
locationCountry = "China"
locationProvince = selected province
locationCities = selected cities
locationCity = first selected city or "" for compatibility
locationAddress = trimmed detail address, optional
location = formatted display string
```

If province or cities are missing, show the same style of validation as the old required Location field.

Do not allow saving a new Journey without province and at least one city if the old form required Location.

For existing old Journeys, if the user does not touch structured fields, do not destroy the old location fallback.

---

## 12. Validation behavior

Province and at least one city should be required.

Detailed address / 具体地址 is optional:

```text
do not add a required * marker to this field
do not block create/save if it is empty
save it as an empty string or undefined according to existing project conventions
```

Suggested validation message:

```text
Please select a province and at least one city.
```

or more specific:

```text
Please select a province.
Please select at least one city.
```

Keep message style consistent with the existing form.

Do not add complex validation.

---

## 13. Display behavior outside forms

Home and Journey Detail should keep using a display location string.

Recommended logic:

```text
If structured province and locationCities exist:
  display formatted structured location.
Else if structured province and locationCity exist:
  display formatted single-city structured location.
Else:
  display existing journey.location.
```

This ensures old data remains readable.

Do not add province/city chips to Home in this version.

Do not change Home card density.

Do not add location grouping.

Do not add timeline grouping.

---

## 14. Suggested implementation steps

1. Inspect current Journey type and form handling.
2. Add optional structured location fields to Journey type:
   - locationCountry
   - locationProvince
   - locationCities
   - locationCity compatibility
   - locationAddress
3. Add a static China province/city list.
4. Add a helper to format structured location into a display string.
5. Replace the New Journey single Location input with province/cities/detail fields.
6. Replace the Edit Journey single Location input with the same fields.
7. Ensure changing province clears all selected cities.
8. Ensure city options depend on selected province.
9. Ensure selected cities are visible and removable.
10. Ensure save/create writes both structured fields and display `location`.
11. Ensure old Journey display still works.
12. Ensure Home and Journey Detail display location correctly.
13. Run tests/build commands.

---

## 15. Acceptance checklist

### New Journey

- Location is no longer a single free-text input.
- User can select one province.
- Cities selector is disabled or unavailable before province is selected.
- After selecting province, city options update correctly.
- User can select multiple cities.
- Selected cities are visible.
- User can remove selected cities.
- User can type detailed address / detailed place in a separate row.
- Province is required.
- At least one city is required.
- Detailed address is optional.
- Creating Journey saves structured location fields.
- Creating Journey also saves a display-compatible `location` string.

### Province change behavior

- Select province A.
- Select city A1 and city A2.
- Change province to province B.
- All selected cities are automatically cleared.
- City selector now shows only province B cities.
- Saving cannot accidentally keep A1 or A2 under province B.

This is mandatory.

### Edit Journey

- Existing structured Journey opens with province/cities/address prefilled.
- Existing Journey with old single `locationCity` opens with that city selected if province matches.
- Changing province clears all selected cities.
- Saving updates structured fields and display location.
- Old free-text Journey opens without crashing.
- Old free-text Journey can still be saved without losing location unless user intentionally chooses a new structured location.
- If user chooses new province/cities for an old Journey, new structured location takes over.

### Display

- Home still displays location if Settings allow it.
- Journey Detail still displays location.
- Structured location displays cleanly, for example:
  - `北京 · 北京 · 朝阳区望京街道`
  - `浙江 · 杭州 / 湖州`
  - `云南 · 昆明 / 大理 / 丽江 · 洱海、丽江古城`
- Old location string still displays for old data.

### Regression

- Photo upload still works.
- Cover selection still works.
- Highlights still work.
- Categories still work.
- Notes still work.
- Trash/Safe Delete still works.
- Home low-density style remains unchanged.
- Journey Detail v1.6 remains unchanged except location display compatibility.
- Edit Journey v1.7 curation layout remains intact except location field replacement.

### Scope

- No multi-province journeys.
- No homepage location grouping.
- No timeline.
- No map.
- No GPS.
- No geocoding.
- No AI.
- No export/share.
- No backend/login/cloud storage.

---

## 16. Testing commands

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Fix all errors.

If one of these scripts does not exist in `package.json`, say so clearly and run the closest available command.

Manual testing:

```text
Create a new Journey with 北京 / 北京 / 朝阳区.
Create a new Journey with 浙江 / 杭州 + 湖州 / 西湖区、南浔古镇.
Create a new Journey with 云南 / 昆明 + 大理 + 丽江 / 洱海、丽江古城.
Select 浙江 / 杭州 + 湖州, then switch province to 四川 and confirm all cities are cleared.
Try saving without province and confirm validation works.
Try saving with province but no city and confirm validation works.
Try saving with province + cities but no detailed address and confirm it succeeds.
Open an old Journey with only free-text location and confirm it still displays.
Edit an old Journey and choose a new China province/cities.
Confirm Home still shows location correctly.
Confirm Journey Detail still shows location correctly.
Confirm no Home grouping/timeline was added.
```

---

## 17. Report back

After implementation, report:

1. Which files changed.
2. What data fields were added.
3. Where the China province/city list lives.
4. How province/cities/detail address are saved.
5. How old `location` strings remain compatible.
6. How old single `locationCity` remains compatible.
7. How province change clears all selected cities.
8. Results of:

```bash
npm run lint
npm run typecheck
npm run build
```

---

## 18. Final reminder

This is v1.8 China Province + Multi-city Location Fields.

Only do China province single-select, city multi-select, and optional detailed address input.

Do not implement multi-province trips.

Do not implement the future Home timeline.

Do not implement the future Home location arrangement.

Do not implement maps, GPS, AI, export, backend, login, or cloud storage.

Keep Footprint calm, personal, memory-first, photo-first, and low-density.

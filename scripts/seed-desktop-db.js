/**
 * Footprint 桌面端 SQLite 测试数据种子脚本
 *
 * 直接写入桌面端 Library 的 SQLite 数据库和照片文件。
 *
 * 用法：
 *   node scripts/seed-desktop-db.js
 */

const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// ── 配置 ──────────────────────────────────────────────────────────

const LIBRARY_PATH =
  "D:\\claude+codexproject\\footprint\\test-artifacts\\tauri-fs-permission-verification-20260610\\Library";
const DB_PATH = path.join(LIBRARY_PATH, "footprint.db");
const PHOTOS_DIR = path.join(LIBRARY_PATH, "photos");
const THUMBNAILS_DIR = path.join(LIBRARY_PATH, "thumbnails");

// ── 工具函数 ──────────────────────────────────────────────────────

function uid() {
  return "s" + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function pack(arr) {
  return JSON.stringify(arr);
}

function fromBool(val) {
  return val ? 1 : 0;
}

/** 生成 SVG 占位照片，返回 Buffer */
function generatePhotoSVG(label, hue, saturation, lightness) {
  const w = 800;
  const h = 600;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, ${saturation}%, ${lightness + 20}%)"/>
      <stop offset="60%" stop-color="hsl(${hue}, ${saturation - 10}%, ${lightness}%)"/>
      <stop offset="100%" stop-color="hsl(${hue}, ${saturation - 20}%, ${lightness - 15}%)"/>
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff9c4"/>
      <stop offset="100%" stop-color="#ffcc02"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#s)"/>
  <circle cx="${w * 0.75}" cy="${h * 0.2}" r="50" fill="url(#sun)" opacity="0.9"/>
  <polygon points="0,${h * 0.65} ${w * 0.2},${h * 0.4} ${w * 0.4},${h * 0.55} ${w * 0.55},${h * 0.35} ${w * 0.75},${h * 0.5} ${w},${h * 0.45} ${w},${h} 0,${h}" fill="hsl(${hue}, ${saturation - 30}%, ${lightness - 20}%)" opacity="0.7"/>
  <polygon points="0,${h * 0.8} ${w * 0.3},${h * 0.6} ${w * 0.6},${h * 0.7} ${w},${h * 0.55} ${w},${h} 0,${h}" fill="hsl(${hue}, ${saturation - 10}%, ${lightness - 25}%)" opacity="0.8"/>
  <text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="bold" fill="white" opacity="0.6">${label}</text>
</svg>`,
    "utf-8"
  );
}

/** 简单生成 thumbnail：同一个 SVG，缩小尺寸 */
function generateThumbnailSVG(label, hue, saturation, lightness) {
  const w = 200;
  const h = 150;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, ${saturation}%, ${lightness + 20}%)"/>
      <stop offset="60%" stop-color="hsl(${hue}, ${saturation - 10}%, ${lightness}%)"/>
      <stop offset="100%" stop-color="hsl(${hue}, ${saturation - 20}%, ${lightness - 15}%)"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#s)"/>
  <text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="white" opacity="0.6">${label}</text>
</svg>`,
    "utf-8"
  );
}

// ── 测试旅程数据 ──────────────────────────────────────────────────

const TEST_JOURNEYS = [
  {
    title: "东京之旅",
    location: "东京, 日本",
    startDate: "2024-12-20",
    endDate: "2024-12-28",
    companions: ["伴侣"],
    notes:
      "冬季东京，新宿御苑的银杏、浅草寺的初诣、涩谷的霓虹灯海。在银座吃到了人生中最好吃的寿司，还在秋叶原买了限定手办。最后一天去了箱根泡温泉，富士山在夕阳下美得令人窒息。",
    photos: [
      { label: "新宿御苑·银杏", hue: 35, saturation: 80, lightness: 55, categoryId: "default-landscape", note: "金黄色的银杏叶铺满地面，阳光透过枝叶洒下斑驳光影" },
      { label: "浅草寺·雷门", hue: 10, saturation: 90, lightness: 50, categoryId: "default-landscape", note: "巨大的红色灯笼，人来人往的参道" },
      { label: "涩谷·十字路口", hue: 280, saturation: 70, lightness: 40, categoryId: "default-landscape", note: "世界上最繁忙的十字路口夜景" },
      { label: "银座·寿司", hue: 20, saturation: 60, lightness: 70, categoryId: "default-food", note: "师傅现场捏制，鱼肉入口即化" },
      { label: "秋叶原·手办", hue: 200, saturation: 80, lightness: 50, categoryId: "default-other" },
      { label: "箱根·富士山", hue: 210, saturation: 40, lightness: 65, categoryId: "default-landscape", note: "冬日夕阳下的富士山，山顶积雪映着金色光芒" },
    ],
  },
  {
    title: "冰岛环岛之旅",
    location: "冰岛",
    startDate: "2024-07-05",
    endDate: "2024-07-20",
    companions: [],
    notes:
      "独自驾车环岛 15 天。从雷克雅未克出发，沿着 1 号公路逆时针环绕。看到了绝美的塞里雅兰瀑布、杰古沙龙冰河湖的浮冰、米湖的地热区，还有在胡萨维克出海观鲸。最难忘的是在东部峡湾看到了北极光。",
    photos: [
      { label: "塞里雅兰瀑布", hue: 200, saturation: 30, lightness: 60, categoryId: "default-landscape", note: "水幕从 60 米高处倾泻而下" },
      { label: "杰古沙龙冰河湖", hue: 195, saturation: 50, lightness: 55, categoryId: "default-landscape", note: "湛蓝的浮冰在湖面上缓缓漂移" },
      { label: "黑沙滩", hue: 0, saturation: 0, lightness: 35, categoryId: "default-landscape" },
      { label: "米湖温泉", hue: 180, saturation: 40, lightness: 50, categoryId: "default-other", note: "比蓝湖更安静的地热温泉" },
      { label: "胡萨维克·鲸鱼", hue: 210, saturation: 60, lightness: 45, categoryId: "default-landscape", note: "座头鲸在船边跃出水面" },
      { label: "东部峡湾", hue: 160, saturation: 35, lightness: 50, categoryId: "default-landscape" },
      { label: "北极光", hue: 120, saturation: 80, lightness: 30, categoryId: "default-landscape", note: "绿色光带在夜空中舞动" },
      { label: "冰岛马", hue: 30, saturation: 40, lightness: 55, categoryId: "default-landscape" },
    ],
  },
  {
    title: "云南自驾游",
    location: "云南, 中国",
    startDate: "2025-03-10",
    endDate: "2025-03-24",
    companions: ["小明", "阿杰", "小林"],
    notes:
      "四个好朋友从昆明出发，一路向西。大理古城的洱海骑行、丽江古城的夜生活、香格里拉的松赞林寺、梅里雪山的日照金山。在雨崩村徒步了两天，虽然累但看到了最美的雪山日出。",
    photos: [
      { label: "洱海·日出", hue: 25, saturation: 70, lightness: 60, categoryId: "default-landscape", note: "晨光洒在洱海水面上，远处的苍山若隐若现" },
      { label: "大理古城", hue: 30, saturation: 40, lightness: 65, categoryId: "default-landscape" },
      { label: "丽江古城·夜", hue: 20, saturation: 80, lightness: 35, categoryId: "default-landscape", note: "红灯笼照亮了古老的石板路" },
      { label: "松赞林寺", hue: 10, saturation: 60, lightness: 40, categoryId: "default-landscape", note: "小布达拉宫在晨雾中金光闪闪" },
      { label: "梅里雪山·金山", hue: 15, saturation: 90, lightness: 55, categoryId: "default-landscape", note: "第一缕阳光照亮卡瓦格博峰" },
    ],
  },
  {
    title: "巴黎周末",
    location: "巴黎, 法国",
    startDate: "2024-10-18",
    endDate: "2024-10-21",
    companions: ["伴侣"],
    notes:
      "短途周末旅行。逛了卢浮宫和奥赛博物馆，在塞纳河边的咖啡馆吃了可颂。最浪漫的是在埃菲尔铁塔下等到了整点闪灯——亲眼看到的那一刻还是被感动了。",
    photos: [
      { label: "卢浮宫·金字塔", hue: 30, saturation: 30, lightness: 55, categoryId: "default-landscape" },
      { label: "塞纳河·咖啡", hue: 25, saturation: 50, lightness: 45, categoryId: "default-food", note: "河边的早晨，一杯拿铁和一个可颂" },
      { label: "凡尔赛宫·镜厅", hue: 40, saturation: 90, lightness: 70, categoryId: "default-landscape", note: "357 面镜子在水晶吊灯下熠熠生辉" },
      { label: "埃菲尔铁塔·闪灯", hue: 270, saturation: 60, lightness: 25, categoryId: "default-landscape", note: "整点时分，两万盏灯同时闪烁" },
    ],
  },
  {
    title: "新西兰南岛自驾",
    location: "新西兰南岛",
    startDate: "2025-02-01",
    endDate: "2025-02-16",
    companions: ["爸妈"],
    notes:
      "带爸妈去新西兰南岛自驾。特卡波湖的星空保护区、库克山国家公园徒步、米尔福德峡湾看到海豚跟着船游。爸妈最喜欢箭镇，说像回到了淘金时代。",
    photos: [
      { label: "特卡波湖·星空", hue: 240, saturation: 70, lightness: 25, categoryId: "default-landscape", note: "银河清晰可见，好牧羊人教堂在星空下静静伫立" },
      { label: "库克山·徒步", hue: 200, saturation: 30, lightness: 55, categoryId: "default-landscape", note: "雪山脚下的 Hooker Valley 步道" },
      { label: "皇后镇·湖景", hue: 190, saturation: 50, lightness: 50, categoryId: "default-landscape" },
      { label: "米尔福德峡湾", hue: 180, saturation: 40, lightness: 45, categoryId: "default-landscape", note: "海豚在船边跳跃嬉戏" },
      { label: "箭镇·老街", hue: 20, saturation: 45, lightness: 50, categoryId: "default-landscape" },
      { label: "瓦纳卡湖·孤树", hue: 25, saturation: 55, lightness: 55, categoryId: "default-landscape", note: "湖水清澈见底，一棵柳树独自立在水中" },
      { label: "海鲜拼盘", hue: 15, saturation: 70, lightness: 60, categoryId: "default-food", note: "布拉夫生蚝和凯库拉龙虾" },
    ],
  },
];

// ── 默认分类 ──────────────────────────────────────────────────────

function createCategories(createdAt) {
  return [
    { id: "default-people", name: "People", createdAt },
    { id: "default-landscape", name: "Landscape", createdAt },
    { id: "default-food", name: "Food", createdAt },
    { id: "default-transport", name: "Transport", createdAt },
    { id: "default-other", name: "Other", createdAt },
  ];
}

// ── 主函数 ────────────────────────────────────────────────────────

function main() {
  console.log("📂 Library 路径:", LIBRARY_PATH);
  console.log("🗄️  数据库:", DB_PATH);

  if (!fs.existsSync(DB_PATH)) {
    console.error("❌ 数据库文件不存在:", DB_PATH);
    process.exit(1);
  }

  // 确保目录存在
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");

  const insertJourney = db.prepare(`
    INSERT INTO journeys (
      id, title, location, location_country, location_province,
      location_cities, location_city, location_address,
      start_date, end_date, companions, notes, status,
      cover_photo_id, created_at, updated_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCategory = db.prepare(`
    INSERT INTO photo_categories (
      id, journey_id, name, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const insertPhoto = db.prepare(`
    INSERT INTO photos (
      id, journey_id, file_name, original_file_name, relative_path,
      thumbnail_relative_path, mime_type, width, height,
      category_id, is_cover, is_highlight, note, has_note,
      created_at, updated_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 检查是否已有测试数据
  const existingCount = db.prepare("SELECT COUNT(*) as cnt FROM journeys").get();
  if (existingCount.cnt > 0) {
    console.log(`⚠️  数据库中已有 ${existingCount.cnt} 条旅程，将追加新数据。`);
  }

  let totalPhotos = 0;
  const seedTransaction = db.transaction(() => {
    for (let idx = 0; idx < TEST_JOURNEYS.length; idx++) {
      const def = TEST_JOURNEYS[idx];
      const journeyId = uid();
      const createdAt = daysAgo(90 - idx * 15);
      const now = createdAt;

      // 插入旅程
      insertJourney.run(
        journeyId,
        def.title,
        def.location,
        null, // location_country
        null, // location_province
        null, // location_cities
        null, // location_city
        null, // location_address
        def.startDate,
        def.endDate,
        pack(def.companions),
        def.notes,
        "archived", // status
        `${journeyId}-p0`, // cover_photo_id
        createdAt,
        now,
        null // deleted_at
      );

      // 插入分类
      const categories = createCategories(createdAt);
      for (const cat of categories) {
        insertCategory.run(cat.id, journeyId, cat.name, cat.createdAt, now);
      }

      // 插入照片 + 生成文件
      const journeyPhotosDir = path.join(PHOTOS_DIR, journeyId);
      const journeyThumbsDir = path.join(THUMBNAILS_DIR, journeyId);
      fs.mkdirSync(journeyPhotosDir, { recursive: true });
      fs.mkdirSync(journeyThumbsDir, { recursive: true });

      for (let i = 0; i < def.photos.length; i++) {
        const pd = def.photos[i];
        const photoId = `${journeyId}-p${i}`;
        const photoExt = "svg";

        // 写入照片文件
        const photoFilename = `${photoId}.${photoExt}`;
        const photoFilePath = path.join(journeyPhotosDir, photoFilename);
        fs.writeFileSync(photoFilePath, generatePhotoSVG(pd.label, pd.hue, pd.saturation, pd.lightness));

        // 写入缩略图文件
        const thumbFilename = `${photoId}.jpg`;
        const thumbFilePath = path.join(journeyThumbsDir, thumbFilename);
        fs.writeFileSync(thumbFilePath, generateThumbnailSVG(pd.label, pd.hue, pd.saturation, pd.lightness));

        const relativePath = `photos/${journeyId}/${photoFilename}`;
        const thumbRelativePath = `thumbnails/${journeyId}/${thumbFilename}`;

        insertPhoto.run(
          photoId,
          journeyId,
          photoFilename, // file_name
          photoFilename, // original_file_name
          relativePath,
          thumbRelativePath,
          "image/svg+xml", // mime_type
          800, // width
          600, // height
          pd.categoryId,
          fromBool(i === 0), // is_cover
          fromBool(i < 3), // is_highlight
          pd.note || null,
          fromBool(!!pd.note),
          createdAt,
          now,
          null // deleted_at
        );

        totalPhotos++;
      }

      console.log(`  ✅ ${def.title} — ${def.photos.length} 张照片`);
    }
  });

  seedTransaction();
  db.close();

  console.log(`\n🎉 完成！共添加 ${TEST_JOURNEYS.length} 条旅程，${totalPhotos} 张照片`);
  console.log("🚀 现在可以启动桌面端: npm run desktop:dev");
}

main();

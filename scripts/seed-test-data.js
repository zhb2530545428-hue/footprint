/**
 * Footprint 测试数据种子脚本
 *
 * 用法：
 *   1. 启动 Next.js 开发服务器: npm run dev
 *   2. 打开浏览器访问 http://localhost:3000
 *   3. 打开浏览器控制台 (F12 → Console)
 *   4. 复制粘贴此文件全部内容并回车执行
 *   5. 刷新页面即可看到 5 条测试旅程
 *
 * 生成的测试数据：
 *   1. 东京之旅 — 冬季，和伴侣一起，6 张照片
 *   2. 冰岛环岛 — 夏季，独自旅行，8 张照片
 *   3. 云南自驾 — 春季，和朋友一起，5 张照片
 *   4. 巴黎周末 — 秋季，和伴侣一起，4 张照片
 *   5. 新西兰南岛 — 夏季，和家人一起，7 张照片
 */

// ── 占位照片生成器 ────────────────────────────────────────────────

/** 生成一个 SVG 数据 URL 作为占位旅行照片 */
function placeholderPhoto(label, hue, saturation, lightness) {
  const w = 800;
  const h = 600;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, ${saturation}%, ${lightness + 20}%)"/>
      <stop offset="60%" stop-color="hsl(${hue}, ${saturation - 10}%, ${lightness}%)"/>
      <stop offset="100%" stop-color="hsl(${hue}, ${saturation - 20}%, ${lightness - 15}%)"/>
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff9c4"/>
      <stop offset="100%" stop-color="#ffcc02"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <!-- 太阳/月亮 -->
  <circle cx="${w * 0.75}" cy="${h * 0.2}" r="50" fill="url(#sun)" opacity="0.9"/>
  <!-- 远山 -->
  <polygon points="0,${h * 0.65} ${w * 0.2},${h * 0.4} ${w * 0.4},${h * 0.55} ${w * 0.55},${h * 0.35} ${w * 0.75},${h * 0.5} ${w},${h * 0.45} ${w},${h} 0,${h}" fill="hsl(${hue}, ${saturation - 30}%, ${lightness - 20}%)" opacity="0.7"/>
  <!-- 近山/地面 -->
  <polygon points="0,${h * 0.8} ${w * 0.3},${h * 0.6} ${w * 0.6},${h * 0.7} ${w},${h * 0.55} ${w},${h} 0,${h}" fill="hsl(${hue}, ${saturation - 10}%, ${lightness - 25}%)" opacity="0.8"/>
  <!-- 标签 -->
  <text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="bold" fill="white" opacity="0.6">${label}</text>
</svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

// ── 工具函数 ──────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ── 创建照片 ──────────────────────────────────────────────────────

function createPhotos(journeyId, photoDefs, createdAt) {
  return photoDefs.map((def, i) => ({
    id: `${journeyId}-p${i}`,
    url: placeholderPhoto(def.label, def.hue, def.saturation, def.lightness),
    fileName: `test-photo-${i + 1}.svg`,
    isCover: i === 0,
    isHighlight: i < 3,
    categoryId: def.categoryId,
    note: def.note || null,
    hasNote: !!def.note,
    createdAt: createdAt,
  }));
}

// ── 创建分类 ──────────────────────────────────────────────────────

function createCategories(createdAt) {
  return [
    { id: "default-people", name: "People", createdAt },
    { id: "default-landscape", name: "Landscape", createdAt },
    { id: "default-food", name: "Food", createdAt },
    { id: "default-transport", name: "Transport", createdAt },
    { id: "default-other", name: "Other", createdAt },
  ];
}

// ── 测试旅程数据 ──────────────────────────────────────────────────

const testJourneys = [
  {
    // 1. 东京之旅
    title: "东京之旅",
    location: "东京, 日本",
    locationCountry: undefined,
    startDate: "2024-12-20",
    endDate: "2024-12-28",
    companions: ["伴侣"],
    notes: "冬季东京，新宿御苑的银杏、浅草寺的初诣、涩谷的霓虹灯海。在银座吃到了人生中最好吃的寿司，还在秋叶原买了限定手办。最后一天去了箱根泡温泉，富士山在夕阳下美得令人窒息。",
    status: "archived",
    photos: [
      { label: "新宿御苑·银杏", hue: 35, saturation: 80, lightness: 55, categoryId: "default-landscape", note: "金黄色的银杏叶铺满地面，阳光透过枝叶洒下斑驳光影" },
      { label: "浅草寺·雷门", hue: 10, saturation: 90, lightness: 50, categoryId: "default-landscape", note: "巨大的红色灯笼，人来人往的参道" },
      { label: "涩谷·十字路口", hue: 280, saturation: 70, lightness: 40, categoryId: "default-landscape", note: "世界上最繁忙的十字路口夜景" },
      { label: "银座·寿司", hue: 20, saturation: 60, lightness: 70, categoryId: "default-food", note: "师傅现场捏制，鱼肉入口即化" },
      { label: "秋叶原·手办店", hue: 200, saturation: 80, lightness: 50, categoryId: "default-other" },
      { label: "箱根·富士山", hue: 210, saturation: 40, lightness: 65, categoryId: "default-landscape", note: "冬日夕阳下的富士山，山顶积雪映着金色光芒" },
    ],
  },
  {
    // 2. 冰岛环岛
    title: "冰岛环岛之旅",
    location: "冰岛",
    locationCountry: undefined,
    startDate: "2024-07-05",
    endDate: "2024-07-20",
    companions: [],
    notes: "独自驾车环岛 15 天。从雷克雅未克出发，沿着 1 号公路逆时针环绕。看到了绝美的塞里雅兰瀑布、杰古沙龙冰河湖的浮冰、米湖的地热区，还有在胡萨维克出海观鲸。最难忘的是在东部峡湾看到了北极光——虽然是夏天，但运气好到爆棚。",
    status: "archived",
    photos: [
      { label: "塞里雅兰瀑布", hue: 200, saturation: 30, lightness: 60, categoryId: "default-landscape", note: "水幕从 60 米高处倾泻而下，可以走到瀑布后面" },
      { label: "杰古沙龙冰河湖", hue: 195, saturation: 50, lightness: 55, categoryId: "default-landscape", note: "湛蓝的浮冰在湖面上缓缓漂移" },
      { label: "黑沙滩", hue: 0, saturation: 0, lightness: 35, categoryId: "default-landscape" },
      { label: "米湖温泉", hue: 180, saturation: 40, lightness: 50, categoryId: "default-other", note: "比蓝湖更安静的地热温泉" },
      { label: "胡萨维克·鲸鱼", hue: 210, saturation: 60, lightness: 45, categoryId: "default-landscape", note: "座头鲸在船边跃出水面" },
      { label: "东部峡湾", hue: 160, saturation: 35, lightness: 50, categoryId: "default-landscape" },
      { label: "北极光", hue: 120, saturation: 80, lightness: 30, categoryId: "default-landscape", note: "绿色光带在夜空中舞动——七月也能看到极光！" },
      { label: "冰岛马", hue: 30, saturation: 40, lightness: 55, categoryId: "default-landscape" },
    ],
  },
  {
    // 3. 云南自驾
    title: "云南自驾游",
    location: "云南, 中国",
    locationCountry: "China",
    locationProvince: "云南",
    startDate: "2025-03-10",
    endDate: "2025-03-24",
    companions: ["小明", "阿杰", "小林"],
    notes: "四个好朋友从昆明出发，一路向西。大理古城的洱海骑行、丽江古城的夜生活、香格里拉的松赞林寺、梅里雪山的日照金山。在雨崩村徒步了两天，虽然累但看到了最美的雪山日出。回程在沙溪古镇住了一晚，安静得像是时间停止了一样。",
    status: "archived",
    photos: [
      { label: "洱海·日出", hue: 25, saturation: 70, lightness: 60, categoryId: "default-landscape", note: "晨光洒在洱海水面上，远处的苍山若隐若现" },
      { label: "大理古城", hue: 30, saturation: 40, lightness: 65, categoryId: "default-landscape" },
      { label: "丽江古城·夜", hue: 20, saturation: 80, lightness: 35, categoryId: "default-landscape", note: "红灯笼照亮了古老的石板路" },
      { label: "松赞林寺", hue: 10, saturation: 60, lightness: 40, categoryId: "default-landscape", note: "小布达拉宫在晨雾中金光闪闪" },
      { label: "梅里雪山·日照金山", hue: 15, saturation: 90, lightness: 55, categoryId: "default-landscape", note: "第一缕阳光照亮卡瓦格博峰" },
    ],
  },
  {
    // 4. 巴黎周末
    title: "巴黎周末",
    location: "巴黎, 法国",
    locationCountry: undefined,
    startDate: "2024-10-18",
    endDate: "2024-10-21",
    companions: ["伴侣"],
    notes: "短途周末旅行。周五晚上到达，住在蒙马特区的一间小公寓。周六逛了卢浮宫和奥赛博物馆，在塞纳河边的咖啡馆吃了可颂。周日去了凡尔赛宫，镜厅太震撼了。最浪漫的是在埃菲尔铁塔下等到了整点闪灯——虽然已经看过无数张照片，但亲眼看到的那一刻还是被感动了。",
    status: "archived",
    photos: [
      { label: "卢浮宫·金字塔", hue: 30, saturation: 30, lightness: 55, categoryId: "default-landscape" },
      { label: "塞纳河·咖啡", hue: 25, saturation: 50, lightness: 45, categoryId: "default-food", note: "河边的早晨，一杯拿铁和一个可颂" },
      { label: "凡尔赛宫·镜厅", hue: 40, saturation: 90, lightness: 70, categoryId: "default-landscape", note: "357 面镜子在水晶吊灯下熠熠生辉" },
      { label: "埃菲尔铁塔·闪灯", hue: 270, saturation: 60, lightness: 25, categoryId: "default-landscape", note: "整点时分，两万盏灯同时闪烁" },
    ],
  },
  {
    // 5. 新西兰南岛
    title: "新西兰南岛自驾",
    location: "新西兰南岛",
    locationCountry: undefined,
    startDate: "2025-02-01",
    endDate: "2025-02-16",
    companions: ["爸妈"],
    notes: "带爸妈去新西兰南岛自驾。从基督城出发，经过特卡波湖看了星空保护区，在库克山国家公园徒步，皇后镇的蹦极虽然没敢跳但看别人跳也很刺激。最惊喜的是米尔福德峡湾，坐船穿过瀑布时看到海豚跟着船游。爸妈最喜欢的是箭镇，说像回到了淘金时代。",
    status: "archived",
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

// ── 主函数 ────────────────────────────────────────────────────────

async function seedTestData() {
  const STORAGE_KEY = "footprint.journeys";

  // 读取现有 journeys
  let existing = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      existing = Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    // ignore
  }

  if (existing.length > 0) {
    const ok = confirm(
      `⚠️ 当前已有 ${existing.length} 条旅程数据。\n\n` +
      `选择「确定」：保留现有数据，追加 ${testJourneys.length} 条测试数据\n` +
      `选择「取消」：放弃操作`
    );
    if (!ok) {
      console.log("❌ 已取消。");
      return;
    }
  }

  const now = new Date().toISOString();
  const newJourneys = testJourneys.map((def, idx) => {
    const journeyId = uid();
    const createdAt = daysAgo(90 - idx * 15);
    return {
      id: journeyId,
      title: def.title,
      location: def.location,
      locationCountry: def.locationCountry || undefined,
      locationProvince: def.locationProvince || undefined,
      startDate: def.startDate,
      endDate: def.endDate,
      companions: def.companions,
      notes: def.notes,
      status: def.status,
      coverPhotoId: `${journeyId}-p0`,
      photos: createPhotos(journeyId, def.photos, createdAt),
      categories: createCategories(createdAt),
      createdAt: createdAt,
      updatedAt: createdAt,
    };
  });

  const allJourneys = [...existing, ...newJourneys];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allJourneys));

  console.log(`✅ 成功添加 ${newJourneys.length} 条测试旅程！`);
  console.log("");
  console.log("📸 已创建的旅程：");
  newJourneys.forEach((j, i) => {
    console.log(`  ${i + 1}. ${j.title} — ${j.location} (${j.photos.length} 张照片, 状态: ${j.status})`);
  });
  console.log("");
  console.log("🔃 刷新页面即可看到新数据。如果首页没显示，请确认旅程状态为 'archived'。");
}

// 执行
seedTestData().catch(console.error);

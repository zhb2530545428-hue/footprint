# CLAUDE.md — Footprint

## 项目概述

Footprint 是一个个人旅行照片记忆 Web 应用。核心理念：

> 去了哪里 → 和谁一起 → 什么时候 → 哪些照片和回忆值得保留

产品定位：Airbnb 风格的旅行记忆画廊 —— 干净、白色、照片优先、低密度、平静温暖。**不是**照片管理后台。

详细文档：
- `docs/PRODUCT.md` — 产品规格
- `docs/DESIGN.md` — UI 设计系统
- `docs/TASKS.md` — MVP 实施计划
- `docs/ROADMAP.md` — 版本规划
- `docs/BACKLOG.md` — 长期产品待办

## 技术栈

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **localStorage** (v1 持久化)
- 无后端、无数据库、无登录、无 AI、无云存储（v1）

## 路由

```
/                   — 首页
/journeys/new       — 创建新旅程
/journeys/[id]      — 旅程详情
```

## 目录结构

```
app/
  page.tsx
  journeys/
    new/page.tsx
    [id]/page.tsx
components/
  TopNav.tsx, JourneyCard.tsx, JourneyGrid.tsx, JourneyForm.tsx
  UploadDropzone.tsx, PhotoGrid.tsx, PhotoTile.tsx, PhotoLightbox.tsx
  EmptyState.tsx, SegmentedTabs.tsx
lib/
  types.ts, storage.ts, mock-data.ts, utils.ts
```

## MVP v1 范围

**要做的：**
- 首页归档旅程卡片网格
- 单页新旅程创建流程
- 旅程元数据输入（标题、地点、日期、同伴、备注）
- 本地图片上传预览（`URL.createObjectURL`）
- 手动封面选择和 Highlight 标记
- 归档旅程
- 相册式旅程详情页
- 照片灯箱
- localStorage 持久化 + mock 数据

**不做的：**
- AI 照片选择、真实后端、数据库、登录、地图、时间线、导出、设置页、A/B/C/D PK 对比

## 关键产品约束

- 首页只显示 `status === "archived"` 的旅程卡片
- 首页不暴露 AI/策展/上传状态/照片评分等复杂工具
- 新旅程是单页，上传和策展复杂度都在此页面内
- 照片上传是可选的（旅程可能创建在旅行之前）
- AI 推荐但不强制决定；不自动删除照片
- 笔记不应烧录到照片上，以橙色小圆点指示，hover/打开时展示

## 数据模型关键字段

```ts
Journey: { id, title?, location, startDate?, endDate?, companions[], notes?, status, coverPhotoId?, photos[], createdAt, updatedAt }
JourneyPhoto: { id, url, fileName?, isCover, isHighlight, category?, note?, hasNote, createdAt }
```

## UI 设计要点

- 背景白、圆角卡片（22px）、宽松间距、低信息密度
- 暖橙色点缀（#f97316），少用
- 系统字体 / Inter
- 英文 UI 标签

---

## 行为准则

**Tradeoff:** 这些准则偏向谨慎。简单任务可自行判断。

### 1. 先思考再编码

实现前：
- 明确陈述你的假设，不确定时发问
- 如果存在多种解释，列出来——不要默默地选一个
- 如果有更简单的方法，说出来
- 如果有不清楚的地方，停下来。说出困惑，然后问

### 2. 简单优先

**最小化代码解决问题。不写推测性代码。**
- 不添加未被要求的功能
- 不为单次使用创建抽象
- 不为不可能的场景做错误处理
- 如果 200 行可以写成 50 行，重写

### 3. 精准修改

**只动必须动的。只清理自己造成的混乱。**
- 不要"改进"相邻代码、注释或格式
- 不要重构没坏的东西
- 匹配现有风格
- 你的改动造成的孤儿（未使用的 import/变量/函数）要清理

### 4. 目标驱动

把任务转化为可验证的目标，给出验证标准。多步骤任务先列出步骤和每步的验证方式。

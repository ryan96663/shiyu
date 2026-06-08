# CHANGELOG 7 — v6.0 一体化背景图 + Demo 场景系统

## 📋 版本概述

v6.0 是一次从"分层素材拼接"到"一体化背景图+热区覆盖"的战略简化。核心思想：**让设计师控制视觉，代码只负责放图+定位热区**。同时完成了 Demo 双场景自动播放系统、多店铺脚本路由、以及 20+ 处 bug 修复。

**核心变化**：
- 🎯 场景渲染：背景图+独立 PNG 拼接 → 单张一体化背景图+百分比热区覆盖
- 🎬 Demo 系统：从零搭建完整 Demo 自动播放引擎（双场景 2 店铺）
- 🛠️ 文档升级：PRD/CLAUDE/商业价值分析 全面重写
- 🐛 Bug 修复：20+ 处（图片扩展名、搜索过滤、z-index 层级、WebSocket 崩溃等）

---

## 🏗️ 架构变更

### 1. 场景渲染 v5.x → v6.0

| 维度 | v5.x (Combo 素材方案) | v6.0 (一体化背景图) |
|------|----------------------|-------------------|
| 背景 | 512×512px 底图 | 320×750px 完整场景图（桌椅墙壁统一绘制） |
| 桌位 | 7张80×80px独立PNG叠加 | 零拼接，热区 percentage 坐标覆盖 |
| 坐标 | 2.5D等距投影 + Grid协议 | left%/top% 百分比数组 |
| 代码量 | ~800行（含组件） | ~350行（页面内） |
| 故障模式 | PNG/JPG扩展名/格式不匹配、加载失败、坐标偏移 | 一张图加载，无拼接故障点 |

**废弃文件**（保留备份不删除）：
- `frontend/components/restaurant-canvas/` — DOM绝对定位拼接组件
- `frontend/config/iso-templates.js` — 等距坐标模板

### 2. Demo 自动播放引擎

- **数据层**：`frontend/config/demo-script.js` — 两个店铺的完整对话脚本
- **播放层**：`detail.js` 中 `setTimeout` 按秒数偏移注册 → `playGroupMessage()` 统一处理
- **展示层**：群聊面板 + 弹幕 + 热区气泡 + 发言计数标签
- **店铺路由**：`getStoreScript(storeName)` 按店铺名加载对应脚本

### 3. 两个 Demo 场景

| | 场景 A | 场景 B |
|------|------|------|
| 店铺 | 美味中餐厅 | 日式料理屋 |
| 形式 | 7人群聊 | 两桌私聊 |
| 时长 | 5分钟（62条） | 1分20秒（16条） |
| 内容 | 菜品点评+推荐+请客+加微信 | 旅游问路+本地推荐 |
| 展示价值 | 真实评价公信力、线下互动温暖 | 打招呼实用价值、低压力破冰 |

---

## 📝 文档更新

### PRD.md
- ✅ §4.2 全面重写 — 从分层拼接方案改为一体化背景图+热区方案
- ✅ §4.7 重写 — 从"图片自动更新系统"改为"场景更新策略（Demo阶段/后续演进）"
- ✅ §5 页面结构 — 从空壳填充完整路由表+详情页结构图+导航关系图
- ✅ §6.1 系统架构 — 填补空白的架构图
- ✅ §6.2 性能指标 — 去掉 Canvas 的 60fps/DrawCall 指标，改为图片加载+CSS动画指标
- ✅ §8 商业模式 — 从 10 条名词扩充为 100+ 行商业计划书深度分析

### CLAUDE.md
- ✅ §2.2 — v5.1 Combo方案 → v6.0 一体化背景图方案
- ✅ §2.7 — Canvas/NPC性能规范 → 热区+气泡规范
- ✅ §3.1 技术栈 — 版本号 v5.1→v6.0
- ✅ §3.2 目录结构 — 组件描述+config目录+images目录更新
- ✅ §5.1 限制 — 去掉过时的 Canvas/DOM Canvas 行
- ✅ §5.3 约定 — v5.1餐厅场景约定 → v6.0
- ✅ §5.5 — 坐标协议 → 热区坐标百分比规范
- ✅ §6.1 功能状态 — 场景+素材描述更新
- ✅ §6.3 Demo路径 — 更新为 v6.0 操作流程

### 商业价值分析.md
- ✅ 全面重写（~240行大纲 → ~400行完整商业计划书）
- ✅ 新增：执行摘要表格、核心数据预测（3年）、4层级变现模型、定价/付费率/收入结构表
- ✅ 更新：去除过时的 AI/Canvas 描述，对齐 v6.0 技术方案

### docs/README.md
- ✅ 新建 — 适合 GitHub 的项目首页 README
- ✅ 侧重：用户需求→为什么现有产品不够→食遇的解法→技术架构→快速开始→Demo演示

---

## 💻 代码变更

### 新增文件

| 文件 | 说明 |
|------|------|
| `frontend/config/hotspots.js` | 热区百分比坐标配置（以背景图左上角为原点） |
| `frontend/config/demo-script.js` | 两个 Demo 场景脚本 + 桌号热区映射 + 店铺路由函数 |
| `frontend/config/store-image-map.js` | 店铺名→图片路径映射 + `resolveStoreImage/Images` 函数 |
| `docs/README.md` | GitHub 项目首页文档 |

### 重写文件

| 文件 | 行数变化 | 说明 |
|------|---------|------|
| `frontend/pages/store/detail.js` | 863→~350行 | 去掉 Canvas/组件逻辑，改为 hotspots+气泡+Demo播放引擎+发言面板 |
| `frontend/pages/store/detail.wxml` | 重写 | `<restaurant-canvas>` → `<image>` + 热区`<view>` + 浮动聊天面板 + 历史发言面板 |
| `frontend/pages/store/detail.wxss` | 大幅简化 | 新增：气泡动画+群聊面板+弹幕栏+发言面板；删除：Canvas/loading样式 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `frontend/pages/store/detail.json` | 去掉 `restaurant-canvas` 组件引用 |
| `frontend/pages/index/index.js` | 引入 `resolveStoreImages` 映射（8个出口）、`performSearch` 改为本地过滤、加 `onSearchBlur`、`onStoreTap` 传店铺名 |
| `frontend/pages/index/index.wxml` | 所有图标引用 .png→.jpg（18处）、`store1.jpg`→`meiweizhongcanting.jpg`、加 `bindblur` + `data-store-name` |
| `frontend/pages/auth/login.js` | 删除 `User-Agent` header（微信不支持） |

### 废弃文件（保留备份）

| 文件 | 原因 |
|------|------|
| `frontend/components/restaurant-canvas/` | v6.0 不再使用组件拼接方案 |
| `frontend/config/iso-templates.js` | 等距坐标模板不再需要 |

---

## 🐛 Bug 修复（20+ 处）

### 渲染/素材类

| Bug | 根因 | 修复 |
|-----|------|------|
| 背景图 `restaurant.png` 500 错误 | 文件是JPEG但扩展名为.png | 恢复为 `.jpg` + config指向 `.jpg` |
| 首页19个图标全部不显示 | 磁盘全是 `.jpg`，代码引用 `.png` | index.wxml/index.js/detail.wxml 中全部改为 `.jpg` |
| `store1.jpg` 500 错误 | 文件不存在（mock图都是拼音命名） | 兜底路径改为 `meiweizhongcanting.jpg` |

### 搜索/导航类

| Bug | 根因 | 修复 |
|-----|------|------|
| 搜索"火锅"不显示过滤结果 | `performSearch`→`loadNearbyStores`→API超时60s→`isLoading:true`卡死UI | 改为直接 `filterLocalStores`，不发API |
| 搜索后无法回到首页 | 清空搜索词后 `showSearchHistory:true`，输入框保持聚焦 | 加 `bindblur="onSearchBlur"` → 失焦自动收起 |
| 日式料理屋不播放脚本2 | `encodeURIComponent` 与 WeChat 框架自动编码冲突→店名解码为乱码 | 去掉 `encodeURIComponent`，对齐其他所有 `navigateTo` |
| `onStoreTap` 不传店铺名 | URL 只有 `store_id` 没有 `storeName` | 加 `data-store-name` + URL传参 |

### 布局/层级类

| Bug | 根因 | 修复 |
|-----|------|------|
| 聊天面板撑高页面，与互动栏重影 | 面板作为独立区块在 flex 流中 | 改为 `position:absolute` 浮动叠加层 |
| 数字标签压在聊天面板上面 | z-index:90 > 面板50 | 降为 z-index:40 |
| 聊天面板无法滚动 | WeChat `scroll-view` 要求显式 height | `flex:1` → `height:232rpx` |
| 关闭弹幕→眼睛图标消失 | 图标在 `wx:if` 条件块内 | 拆分为独立常驻开关栏 |

### 交互/稳定性类

| Bug | 根因 | 修复 |
|-----|------|------|
| `closeSocket:fail task not found` | WebSocket连接失败后调用close()崩溃 | try-catch 保护 |
| 计数标签点击无反应 | `pointer-events:none` 阻断了点击 | 删除该属性 + 添加 `catchtap` |
| 个人/客服按钮没有文字 | 只有 icon 没有 text | 加 "客服"/"分享" 文字 |
| 打招呼按钮图标不显示 | `message.png` → 实际是 `.jpg` | 改为 `message.jpg` |

### Demo/数据类

| Bug | 根因 | 修复 |
|-----|------|------|
| 脚本不分店铺 | 无店铺路由，永远播放脚本1 | `getStoreScript(storeName)` 路由 |
| 脚本2不展示气泡+计数 | 打招呼格式缺 `table/hotspot` 字段 | 转为群聊格式 |
| 脚本消息带角色名 | `${msg.table}号桌 ${msg.name}` | 改为仅 `${msg.table}号桌` |
| 7号桌设为空桌 | 圆圆8条对白需重新分配 | 逐一分配给其他6人 |

---

## 🎯 项目当前状态

### Demo 演示路径（更新）

```
微信开发者工具编译 → 首页（30条Mock店铺列表，支持搜索过滤）
  → 点击"美味中餐厅" → 脚本1自动播放（群聊点评→请客加微信）
  → 点击"日式料理屋" → 脚本2自动播放（打招呼问路）
  → 观看体验：
      🗣 群聊消息逐条弹出（每5秒一句）
      💬 场景图对应桌位弹出气泡
      🔢 每桌累计发言数字标签（可点击查看该桌历史发言）
      📜 浮动聊天面板半透明叠在场景底部
      👁️ 弹幕开关常驻
```

### 待解决（沿用 CLAUDE.md §6.2）

| 优先级 | 问题 | 影响 |
|--------|------|------|
| P0 | WebSocket 不兼容 | 实时功能不可用 |
| P0 | 数据无持久化 | 重启丢失 |
| P1 | 微信消息推送未接入 | 无真机通知 |

---

## 📦 文件变更统计

| 类型 | 数量 | 文件 |
|------|------|------|
| 新建 | 4 | hotspots.js, demo-script.js, store-image-map.js, docs/README.md |
| 重写 | 4 | detail.js, detail.wxml, detail.wxss, 商业价值分析.md |
| 修改 | 5 | detail.json, index.js, index.wxml, login.js, PRD.md, CLAUDE.md |
| 废弃 | 2 | restaurant-canvas/ (3文件), iso-templates.js |
| **总计** | **15** | |

---

**总结**: CHANGELOG 7 标志着食遇从"技术驱动"（复杂渲染引擎）向"设计驱动"（一张好图 + 简洁代码）的转型完成。Demo 系统已具备面向演示的完整体验，核心社交价值（真实评价、低压力破冰、场景化温暖互动）可通过两个脚本清晰展示。

*版本: v6.0 | 日期: 2026-06-08*

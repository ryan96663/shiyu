# 代码更改日志

> 生成时间：2026-06-01  
> 目的：修复项目启动崩溃 → 前后端联调通 → 前端界面可用  
> 项目：食遇（美食社交微信小程序）

---

## 一、修复的启动级 Bug（阻塞 `node src/app.js` 运行）

### 1. `backend/src/services/socketService.js` — 文件结构重写
- **问题**：`module.exports` 嵌在 class 体内部（第 372 行），导致后续方法在类外部定义，引用 `this` 失效。`setupGroupEvents` 被重复定义两次。
- **修复**：完整重写，统一 class 结构，合并为一个 `setupGroupEvents`，`module.exports` 移到文件末尾。

### 2. `backend/src/config/index.js` — 缺少 `database` 嵌套属性
- **问题**：`app.js` 中 `config.database.mongodb.uri` 找不到，启动时直接报 `undefined`。
- **修复**：添加 `database: { mongodb: { uri: ... }, redis: { uri: ... } }`。

### 3. `backend/src/middleware/auth.js` — 导出格式 + config 路径
- **问题 1**：`module.exports = { authenticateToken, ... }` 导出对象，但 `app.js` 和路由文件把它当函数 `authMiddleware(req,res,next)` 使用，Express 不接受对象作为中间件。
- **问题 2**：`require('../config/config')` 路径不存在。
- **问题 3**：`require('./logger')` 指向 middleware/logger（工厂函数），实际需要 utils/logger。
- **修复**：改为 `module.exports = authenticateToken`（默认导出函数），附加属性导出 `authorizeRoles`、`optionalAuthenticate`。config 路径改为 `../config`，logger 路径改为 `../utils/logger`。添加 `req.user.id = decoded.userId` 兼容各路由的不同取值方式。

### 4. `backend/src/middleware/logger.js` — 导出格式 + config 路径
- **问题**：`module.exports = { requestLogger, ... }` 导出对象，但 `app.js` 调用为 `loggerMiddleware(this.logger)` 工厂模式。
- **修复**：改为 `module.exports = function(loggerInstance) { return requestLogger; }` 工厂函数，附加属性导出。

### 5. `backend/src/middleware/errorHandler.js` — 导出格式 + logger 路径
- **问题**：同 logger，导出对象但 `app.js` 作为工厂函数调用。
- **修复**：改为工厂函数，logger 路径从 `./logger` 改为 `../utils/logger`。

### 6. `backend/src/routes/auth.js` — config + logger 路径
- **问题**：`require('../config/config')` 不存在，`require('../middleware/logger')` 错误。
- **修复**：改为 `require('../config')` 和 `require('../utils/logger')`。

### 7. `backend/src/app.js` — 数据库连接崩溃 + 端口引用
- **问题 1**：`connectDatabase()` 和 `connectRedis()` 连接失败时 `throw error`，导致服务器无法启动。
- **问题 2**：`config.server.port` 在新 config 中不存在（新 config 是顶层 `PORT`）。
- **修复**：改为 `catch` 后 `logger.warn` 继续执行。端口改为 `config.PORT || 3000`。Redis 连接增加 3 秒超时 `socket: { connectTimeout: 3000, reconnectStrategy: false }`。

### 8. `backend/src/routes/bottle.js` — 用户 ID 取值修复
- **问题**：所有方法使用 `req.user.id`（不存在），应使用 `req.userId`。
- **修复**：全局替换 `const userId = req.user.id;` → `const userId = req.userId || req.user.id;`。

---

## 二、运行时依赖修复

| 操作 | 原因 |
|------|------|
| `npm install`（backend 目录） | 初始安装全部依赖 |
| `npm uninstall sharp` | sharp 的 libvips 二进制包下载超时，项目未实际使用 |
| `npm install node-cron` | scheduler.js 依赖但 package.json 未声明 |
| `mkdir logs`（backend 目录） | app.js 启动时 winston 需要写日志到此目录 |

---

## 三、前端编译错误修复

### 9. `frontend/app.json` — 清理非法字段
- 删除：`name`、`description`、`version`、`miniprogramRoot`、`libs`
- 添加：`requiredPrivateInfos: ["chooseLocation", "getLocation"]`（定位 API 必需）
- 全局标题改为 `食遇`

### 10. `frontend/app.js` — API 地址修正
- `apiBaseUrl`: `https://api.foodie-social.com/api/v1` → `http://localhost:3000/api/v1`
- `socketUrl`: `wss://api.foodie-social.com` → `ws://localhost:3000`

### 11. `frontend/utils/util.js` — 新建
- `app.js` 第 7 行 `require('./utils/util')`，文件此前不存在。

### 12. `frontend/sitemap.json` — 新建
- `app.json` 引用 `sitemapLocation: "sitemap.json"`，文件此前不存在。

### 13. 全局 WXML 语法修复
- `index.wxml`: `{{currentLocation?.name}}` → `{{currentLocation.name}}`（WXML 不支持 `?.`）
- `store/detail.wxml`: 三处 `{{selectedNpc?.xxx}}` → `{{selectedNpc.xxx}}`
- `profile/index.wxml`: `{{(...).toFixed(1)}}` → `{{...}}`（WXML 不支持方法调用）
- `rankings/index.wxml`: 四处 `.toFixed(1)` 同样的修复

### 14. 全局 API URL 修复
- 多个页面的 `wx.request` 硬编码 `http://localhost:3000/api/...`（缺少 `/v1`），改为 `` `${getApp().globalData.apiBaseUrl}/...` ``
- 涉及文件：`bottle/list.js`、`bottle/throw.js`、`bottle/reply.js`、`profile/index.js`、`rankings/index.js`
- `login.js` 中 URL 拼接了两次 `/api/v1`（`apiBaseUrl` 已含 + 又拼 `/api/v1/auth/login`），修正为 `/auth/login`

### 15. `frontend/pages/auth/login.js` — 登录后跳转修复
- `wx.switchTab` → `wx.reLaunch`（项目无 tabBar 配置，switchTab 会失败）
- 同时存 `token` 和 `auth_token`（各页面读取的 key 不一致）

### 16. `frontend/pages/index/index.js` — 兜底数据
- 添加 `onSearchFocus` 方法（WXML 引用但缺失）
- `loadNearbyStores` 增加 API 失败时自动 fallback 到 mock 店铺数据

### 17. `frontend/pages/store/detail.js` — 核心修复
- `onLoad` 同时兼容 `store_id` 和 `storeId` 参数
- `isInsideStore` 默认值改为 `true`（Demo 模式）
- `onJoinGroup` 添加实际功能（设置 `isInsideStore = true`）
- `navigateToOrder` 移除无效的 `wx.navigateToMiniProgram` 调用

### 18. `frontend/pages/store/detail.wxml` — Canvas 覆盖层修复（关键）
- **根因**：微信小程序 `<canvas>` 是原生组件，始终渲染在最顶层。普通 `<view>` + `<button>` 无论在 CSS 中设置多大 `z-index` 都无法显示在 Canvas 之上。
- **修复**：将 `.canvas-overlay` 及其内部所有元素（打招呼按钮、漂流瓶按钮、弹幕区域、招呼气泡）从 `<view>`/`<button>` 改为 `<cover-view>`。`<cover-view>` 是微信提供的原生覆盖组件，可以浮在 canvas/video/map 等原生组件之上。
- 移除按钮上的 `wx:if="{{isInsideStore}}"` 条件（Demo 模式始终显示）。

### 19. `frontend/pages/store/detail.wxss` — 清理 cover-view 不支持的属性
- 移除：`pointer-events`、`box-shadow`、`@keyframes` 动画、`gap`（改为 `margin-bottom`）、多余 `z-index`
- `cover-view` 支持的 CSS：`position`、`display:flex`、`padding`、`margin`、`background-color`、`color`、`font-size`、`border-radius`

### 20. 占位图片生成
- Python 脚本生成 23 张 1×1 透明 PNG，放置于 `frontend/images/` 各子目录，解决所有 `<image>` 标签 500 错误

---

## 四、当前已知限制

| 问题 | 状态 |
|------|------|
| WebSocket 实时通信 | ❌ 前端用原生 WebSocket (`wx.connectSocket`)，后端用 Socket.io 协议，两者不兼容 |
| 后端数据持久化 | ❌ 全部使用内存存储（Map/Object），重启即丢失 |
| MongoDB/Redis 连接 | ⚠️ 已改为非致命，优雅降级到内存模式 |
| AI 像素风格生成 | ❌ AI 服务为 stub，Canvas 绘制的是简单几何图形非像素风格 |
| 右侧聊天面板 | ❌ 仍为普通 `<view>`，需同 `cover-view` 方案迁移 |
| 微信真机测试 | ❌ 需注册小程序 AppID 并配置服务器域名 |

---

## 五、当前可演示的功能

1. 微信开发者工具中登录（Mock 模式）
2. 首页展示店铺列表（API 或 fallback 数据）
3. 进入店铺场景页 → Canvas 像素风格餐厅场景（地板、墙壁、餐桌、NPC 小人、前台）
4. 右上角浮动按钮：打招呼 | 漂流瓶 | 丢漂流瓶（可点击，交互弹 Toast）
5. 底部工具栏：聊天 | 点餐 | 离店
6. 点击 Canvas 中餐桌小人 → 弹出 NPC 交互菜单（询问菜品 / 附近景点 / 推荐餐馆）
7. 点击 Canvas 中"前台" → Demo 提示
8. 左下角弹幕开关
9. 后端 API（curl 可调用）：登录、店铺搜索、三重验证、漂流瓶扔/捞/回复、评价榜单

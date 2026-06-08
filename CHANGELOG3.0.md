# CHANGELOG 3.0 — 首页搜索修复 & 店铺页图层重构

> 日期: 2026-06-01
> 范围: 前端（微信小程序）

---

## 一、首页搜索框修复

### 1.1 缺失样式文件（致命）

**问题**: `app.wxss` 和 `pages/index/index.wxss` 不存在，所有元素高度塌陷为 0，搜索框不可见。

**修复**:
- 新建 `app.wxss` — 全局基础样式（page 重置、按钮重置、安全区域适配）
- 新建 `pages/index/index.wxss` — 首页完整样式（搜索栏、分类网格、店铺卡片、热门推荐）

### 1.2 搜索框事件冲突（P0）

**问题**: `<view class="search-bar" bindtap="onSearchFocus">` 包裹 `<input>`，tap 事件冒泡触发 `setData({ showSearchHistory: true })`，页面重新渲染打断 input 焦点获取，用户无法输入。

**修复**: `index.wxml:16`
```diff
- <view class="search-bar" bindtap="onSearchFocus">
+ <view class="search-bar">
-   <input bindinput="onSearchInput" />
+   <input bindinput="onSearchInput" bindfocus="onSearchFocus" />
```

### 1.3 空 image_url 触发文件夹弹出（P0）

**问题**: 30 条 Mock 数据的 `image_url` 全部为 `''`，WXML 渲染 `<image src="">`。微信开发者工具将空路径解析为项目根目录引用，弹出 `C:\Users\Ryan.MX\Desktop\foodie-social\frontend` 文件夹。

**修复**: `index.wxml:97,132`
```diff
- <image src="{{item.image_url}}" />
+ <image src="{{item.image_url || '/images/mock/store1.jpg'}}" />
```

### 1.4 透明扫码按钮误触（P0）

**问题**: 搜索栏内 `<button class="scan-btn">` 背景色 `rgba(255,107,53,0.1)` 在白色搜索栏上几乎不可见（实际显示 rgb(255,240,235)，与纯白 Δ<20），用户点击搜索框时误触扫码 API，弹出扫码界面而非键盘。

**修复**: 扫码按钮从搜索栏内移到导航栏操作区
```diff
# index.wxml
- <view class="search-bar">
-   <input .../>
-   <button class="scan-btn" bindtap="onScanCode">  <!-- 藏在这里 -->
- </view>
+ <view class="search-bar">
+   <input .../>                                      <!-- 干净的搜索栏 -->
+ </view>
+ <view class="header-actions">
+   <button bindtap="onScanCode">扫码</button>        <!-- 移到导航栏 -->
```

---

## 二、登录流程修复

### 2.1 switchTab 失败

**问题**: `login.js` 用 `wx.switchTab` 跳转首页，但 `app.json` 无 `tabBar` 配置，跳转静默失败。

**修复**: `wx.switchTab` → `wx.reLaunch`

### 2.2 后端不可用时无兜底

**问题**: 后端未启动时，`wx.login()` → API 调用失败 → 用户卡在登录页。

**修复**: 新增 `mockLogin()` 方法，API 失败自动以离线模式登录：
```javascript
// login.js
async mockLogin() {
  const mockToken = 'mock_token_' + Date.now();
  wx.setStorageSync('token', mockToken);
  getApp().globalData.isLoggedIn = true;
  wx.reLaunch({ url: '/pages/index/index' });
}
```

### 2.3 登录状态检查增强

**问题**: `app.js` 只读取 `token` 和 `userInfo` key，但 login.js 存入时同时写了 `auth_token` 和 `user_info`。

**修复**: `checkLoginStatus()` 兼容两种 key：
```javascript
const token = wx.getStorageSync('token') || wx.getStorageSync('auth_token');
const userInfo = wx.getStorageSync('userInfo') || wx.getStorageSync('user_info');
```

### 2.4 位置获取兜底

**问题**: `getLocation()` 权限失败时 reject，导致页面初始化中止。

**修复**: 失败时 resolve 北京国贸默认坐标：
```javascript
fail: () => resolve({ latitude: 39.9042, longitude: 116.4074, accuracy: 30 })
```

---

## 三、店铺详情页图层重构

### 3.1 Canvas 遮挡浮动按钮（P1）

**问题**: Canvas 是微信原生组件，渲染在独立原生层。普通 `<view>` 的 `z-index` 对其无效，"打招呼""漂流瓶"按钮被完全遮挡。

**根因**: 微信渲染层级：
```
原生组件层 (Canvas)         ← 永远最上层
WebView 层 (普通 view)      ← 被 Canvas 覆盖
```

**修复**: 按钮不再覆盖 Canvas，改为 Canvas 下方的独立行（普通 `<view>`）：
```diff
# detail.wxml
- <canvas>
-   <cover-view class="action-bar">  <!-- 浮在 Canvas 上 -->
-     <cover-view>打招呼</cover-view>
-     <cover-view>漂流瓶</cover-view>
-   </cover-view>
- </canvas>
+ <canvas></canvas>                    <!-- 干净的 Canvas -->
+ <view class="interaction-bar">       <!-- Canvas 下方，不重叠 -->
+   <view bindtap="onGreetingClick">打招呼</view>
+   <view bindtap="onThrowBottleClick">丢漂流瓶</view>
+   <view bindtap="onPickBottleClick">捡漂流瓶</view>
+ </view>
```

### 3.2 聊天面板改为页面跳转

**问题**: 原聊天面板 `<view>` 被 Canvas 遮挡，且含有 `<scroll-view>` + `<input>` 无法转为 cover-view。

**修复**: 聊天按钮 → `wx.navigateTo('/pages/chat/group')`
```javascript
// detail.js
onOpenChat() {
  wx.navigateTo({ url: `/pages/chat/group?storeId=${...}&storeName=${...}` });
},
```

### 3.3 打招呼功能改为独立页面

**问题**: 打招呼弹窗（`<view>` + `position:fixed`）被 Canvas 原生层遮挡，仅在编译瞬间闪现。

**修复**: 弹窗迁移至 `pages/greeting/send` 独立页面（无 Canvas，完整可用）：

| 功能 | 状态 |
|------|:--:|
| 15 条预设话术库 | ✅ |
| "换一句"随机切换 | ✅ |
| 自定义输入（30 字限制） | ✅ |
| 实时字数计数 | ✅ |
| ✕ 返回按钮 | ✅ |
| 发送确认 | ✅ |

**涉及文件**:
- `pages/greeting/send.wxml` — 重写
- `pages/greeting/send.js` — 重写（GREETING_PRESETS + 业务逻辑）
- `pages/greeting/send.wxss` — 重写
- `pages/store/detail.js` — 删除 4 个弹窗方法 + 3 个 data 字段 + 预设库常量
- `pages/store/detail.wxml` — 删除 greeting-modal（54 行）
- `pages/store/detail.wxss` — 删除打招呼弹窗样式块（166 行）

### 3.4 聊天面板覆盖层移除

**问题**: 聊天面板作为覆盖层在 Canvas 上不可见。

**修复**: 移除右侧聊天覆盖层，改为底部"聊天"按钮 → 跳转 `/pages/chat/group` 独立页面。

---

## 四、修复的 Bug

| # | Bug | 严重性 | 状态 |
|---|-----|:------:|:----:|
| 1 | `index.wxss` / `app.wxss` 缺失 → 搜索框高度为 0 | 🔴 致命 | ✅ |
| 2 | 搜索框 `bindtap` 阻断 input 焦点 | 🔴 致命 | ✅ |
| 3 | `image_url: ''` 触发文件夹弹出 | 🔴 致命 | ✅ |
| 4 | 透明扫码按钮误触 | 🟠 严重 | ✅ |
| 5 | 登录 `switchTab` 失败 | 🟠 严重 | ✅ |
| 6 | 后端不可用无兜底 | 🟠 严重 | ✅ |
| 7 | Canvas 遮挡浮动按钮 | 🟡 P1 | ✅ |
| 8 | Canvas 遮挡打招呼弹窗 | 🟡 P1 | ✅ |
| 9 | Canvas 遮挡聊天面板 | 🟡 P1 | ✅ |
| 10 | `detail.js` 多余 `},` 语法错误 | 🔴 致命 | ✅ |
| 11 | `getLocation()` 失败导致页面中止 | 🟡 P1 | ✅ |

---

## 五、架构原则（通过此次修复确立）

1. **Canvas 不重叠原则**: 所有交互元素放在 Canvas 区域之外，永远不依赖 z-index 与原生组件竞争
2. **弹窗独立页面原则**: 需要覆盖全屏的弹窗（打招呼、聊天），使用 `wx.navigateTo` 跳转独立页面
3. **Mock 数据完整性**: 所有 Mock 数据 `image_url` 必须有兜底值，防止空路径触发 DevTools 文件系统解析
4. **事件不冒泡原则**: 可输入区域（`<input>`）不在父级绑 `bindtap`，改为在 input 自身绑 `bindfocus`

---

## 六、待处理事项

| # | 任务 | 优先级 | 说明 |
|---|------|:------:|------|
| 1 | 漂流瓶页面图片修复 | 🟡 P1 | `list.wxml` 引用 `/assets/images/empty-bottle.png` 等路径不存在，需改为 `/images/empty/no-stores.png` 或新建占位图 |
| 2 | 后端 Mock 数据扩充 | 🟢 P2 | `backend/src/config/index.js` 的 `STORES` 仅 3 家店铺，前端已有 30 条，需同步扩充 |
| 3 | `wx.getSystemInfoSync` 迁移 | 🟡 P1 | 已废弃，需迁移至 `wx.getWindowInfo()` / `wx.getDeviceInfo()` / `wx.getAppBaseInfo()`，影响 `app.js:36,64` 和 `detail.js:134` |
| 4 | NPC 弹窗 Canvas 遮挡 | 🟡 P1 | 与打招呼弹窗同类问题，`npc-modal` 是普通 `<view>` + `position:fixed`，被 Canvas 原生层遮挡 |
| 5 | WebSocket 实时通信 | 🔴 P0 | 前端 `wx.connectSocket` 与后端 Socket.io 协议不兼容，实时群聊/消息推送不可用 |
| 6 | 数据持久化 | 🔴 P0 | 当前全部使用内存存储（Map/Object），重启丢失数据，需接入 MongoDB + Redis |
| 7 | 微信消息推送 | 🟢 P2 | 漂流瓶分配、打招呼无真机通知，需接入 `wx.requestSubscribeMessage` |

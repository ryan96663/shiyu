# 打招呼 & 漂流瓶按钮显示问题修复日志

## 🛠 问题描述 [当前]
- **现象**: 打招呼 / 漂流瓶按钮登录进店后不可见，仅在编译时一闪而过 [store/detail.wxml | detail.js]
- **根本原因**: Canvas原生组件遮挡 + isInsideStore初始化覆盖

## 📅 修复时间线
- **操作时间**: 2026-06-01
- **影响文件**:
  - `frontend/pages/store/detail.js` (1处修改)
  - `frontend/pages/store/detail.wxml` (多处修改)

## 🔧 详细修改记录

### ✅ 文件1: `frontend/pages/store/detail.js`
**修改位置**: lines [469-477] `checkUserStatus()`
```js
// 原代码 - 问题所在
const isInside = app.globalData.isInsideStore || false;

// 新代码 - 修复后
const isInside = app.globalData.isInsideStore !== undefined ? app.globalData.isInsideStore : true;
```
**修复作用**:
- Demo模式下确保isInsideStore始终为true
- 防止全局状态未定义时按钮条件判断失败

### ✅ 文件2: `frontend/pages/store/detail.wxml`
**修复范围**: lines [38-94] Canvas overlay区域

| 原代码 | 新代码 | 修复说明 |
|--------|--------|--------|
| `<view class="canvas-overlay"> → <cover-view class="canvas-overlay">` | Canvas原生组件上方无法显示view |
| `<view class="top-right-buttons"> → <cover-view class="top-right-buttons">` | 上层容器改为cover-view |
| `<button wx:if="{{isInsideStore}}"...> → <cover-view bindtap="onGreetingClick">` | ** - 移<br>** - 保证可见<br>** - Canvas上方覆盖 |
| `<text class="btn-text"> → <cover-view class="btn-text">` | cover-view支持的内容 |
| `<view class="greeting-bubble"> → <cover-view class="greeting-bubble">` | 气泡信息层叠 |
| `<text class="danmaku-item"> → <cover-view class="danmaku-item">` | 弹幕item可用cover |
| `<view class="floating-btn bottle-btn" wx:if="{{isInsideStore}}"> → <cover-view class="floating-btn bottle-btn" bindtap="onBottleClick">` | 漂流瓶按钮同理修复 |
| `<view class="badge
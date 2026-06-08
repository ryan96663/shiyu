# 项目素材目录结构

> **注意**: 此文档反映项目在v5.1版本下的实际素材使用情况。
> 当前渲染方案已从Canvas API迁移到DOM+Flexbox架构，素材使用方式大幅简化。

## 当前目录结构 (v5.1)

### 主要素材目录

```
foodie_social/
├── frontend/images/
│   ├── restaurant/              # 餐厅场景素材（当前使用）
│   │   ├── bg-day-sunny.png     # 白天晴天背景 (750×320px)
│   │   ├── bg-day-rainy.png     # 白天雨天背景
│   │   ├── bg-night-sunny.png   # 夜间晴天背景
│   │   ├── bg-night-rainy.png   # 夜间雨天背景
│   │   ├── no-person.png       # 无人桌位 (90×90px 透明PNG)
│   │   ├── one-person-1.png    # 1人桌位-版本1
│   │   ├── one-person-2.png    # 1人桌位-版本2
│   │   ├── two-persons-vs1.png # 2人桌位-版本1
│   │   ├── three-persons-vs1.png      # 3人桌位-版本1
│   │   ├── three-persons-vs2.png      # 3人桌位-版本2
│   │   └── four-persons-vs1.png       # 4人桌位-版本1
│   │
│   ├── category/               # 分类图标
│   ├── icons/                  # UI图标
│   ├── mock/                   # Mock店铺图片
│   └── empty/                  # 空状态占位图
│
├── mock-assets/               # 历史素材（已废弃)
│   └── STRUCTURE.md           # 本文件
```

### 渲染架构

**2层渲染架构**（当前v5.1方案）:

| 层级 | 说明 | 技术 |
|------|------|------|
| Layer 1: 场景背景 | 店铺背景图（墙壁、窗户、灯光、地板已画好） | CSS `background-image: cover` |
| Layer 2: 桌位网格 | Combo 透明 PNG 叠加 + 桌号标签 | Flexbox `flex-wrap` + `<image>` |

### 素材使用规范

**背景图** (4张):
- 尺寸: 750×320px
- 按时间（白天/夜间）× 天气（晴天/雨天）切换
- 包含完整场景：墙壁、窗户、灯光、地板

**Combo 桌位图** (7种):
- 尺寸: 90×90px 透明 PNG
- 美术已在PNG中完成桌椅小人的拼接，代码层仅负责显示和位置计算
- 按人数从版本池随机选取以避免重复

### 主题切换

仅背景图路径随主题切换（`bgPath`），Combo 桌位图不按主题拆分。
主题逻辑在组件 `rebuild()` 方法内自包含。

### 已废弃特性

- 🧹 独立桌椅小人WXML拼接（被Combo图方案替代）
- 🧹 NPC交互弹窗（当前仅Toast桌号）
- 🧹 Canvas API绘制方案（已转为DOM+Flexbox）
- 🧹 CSS假窗户、假灯光、假地板（背景图已包含)
- 🧹 AI服务依赖（当前纯前端渲染)

## 当前素材规范 (v5.1)

### 文件格式与规格

**背景图**:
- **格式**: PNG with transparency
- **尺寸**: 750×320px (直接适配微信宽度)
- **文件**: 4张（bg-{time}-{weather}.png 模式)

**Combo桌位图**:
- **格式**: PNG with transparency
- **尺寸**: 90×90px (固定大小)
- **文件**: 7种（按人数和版本分类)

### 性能指标 (与PRD.md同步)

- **帧率标准**: DOM 2D 渲染维持 60fps
- **内存控制**: iOS 低端机内存峰值 < 1GB
- **渲染管线**: DrawCall 控制在 10 以内
- **场景加载**: 餐厅场景渲染完成时间 ≤ 1.5秒

## 快速参考 (当前v5.1)

### 核心素材
```
# 背景图（按主题切换）
bg-day-sunny.png     # 白天晴天
bg-day-rainy.png     # 白天雨天
bg-night-sunny.png   # 夜间晴天
bg-night-rainy.png   # 夜间雨天

# Combo桌位图（按人数使用）
no-person.png        # 无人
one-person-1.png     # 1人-版本1
one-person-2.png     # 1人-版本2
two-persons-vs1.png  # 2人-版本1
three-persons-vs1.png   # 3人-版本1
three-persons-vs2.png   # 3人-版本2
four-persons-vs1.png    # 4人-版本1
```

### 访问路径
```
餐厅场景素材: frontend/images/restaurant/
分类图标: frontend/images/category/
UI图标: frontend/images/icons/
```
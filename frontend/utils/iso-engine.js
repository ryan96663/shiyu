/**
 * 等距渲染引擎 — Isometric Rendering Engine
 * 2:1 等距投影，纯 Canvas 2D 绘制，不依赖外部图片素材
 * 用于在微信小程序中生成模拟经营游戏风格的 3D 餐厅场景
 */

class IsoEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.dpr = 1;

    // 瓷砖尺寸（逻辑像素）
    this.tileWidth = 64;   // 菱形宽度
    this.tileHeight = 32;  // 菱形高度（2:1 比例）

    // 网格尺寸
    this.gridCols = 8;
    this.gridRows = 8;

    // 场景原点的屏幕坐标（tile (0,0) 对应屏幕位置）
    this.originX = 0;
    this.originY = 0;
  }

  // ==================== 初始化 ====================

  /**
   * 初始化 Canvas（接收微信小程序 Canvas 2D node 和 context）
   */
  init(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  /**
   * 设置视口尺寸和 DPR
   */
  setViewport(logicalWidth, logicalHeight, dpr) {
    this.canvasWidth = logicalWidth;
    this.canvasHeight = logicalHeight;
    this.dpr = dpr || 1;

    // 设置 Canvas 物理像素尺寸
    this.canvas.width = logicalWidth * this.dpr;
    this.canvas.height = logicalHeight * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    // 计算原点：让场景居中
    this._calcOrigin();
  }

  /**
   * 设置瓷砖大小
   */
  setTileSize(width, height) {
    this.tileWidth = width;
    this.tileHeight = height || width / 2;
    this._calcOrigin();
  }

  /**
   * 设置网格尺寸
   */
  setGridSize(cols, rows) {
    this.gridCols = cols;
    this.gridRows = rows;
    this._calcOrigin();
  }

  /**
   * 计算场景原点，使网格在 Canvas 上居中
   */
  _calcOrigin() {
    // 计算整个网格在屏幕上占据的矩形
    const topCorner = this.isoToScreen(0, 0);
    const bottomCorner = this.isoToScreen(this.gridCols - 1, this.gridRows - 1);
    const rightCorner = this.isoToScreen(this.gridCols - 1, 0);
    const leftCorner = this.isoToScreen(0, this.gridRows - 1);

    const minScreenX = Math.min(topCorner.x, bottomCorner.x, rightCorner.x, leftCorner.x);
    const maxScreenX = Math.max(topCorner.x, bottomCorner.x, rightCorner.x, leftCorner.x);
    const minScreenY = Math.min(topCorner.y, bottomCorner.y, rightCorner.y, leftCorner.y);
    const maxScreenY = Math.max(topCorner.y, bottomCorner.y, rightCorner.y, leftCorner.y);

    const gridWidth = maxScreenX - minScreenX;
    const gridHeight = maxScreenY - minScreenY;

    // 居中偏移
    this.originX = (this.canvasWidth - gridWidth) / 2 - minScreenX;
    this.originY = (this.canvasHeight - gridHeight) / 2 - minScreenY + 20; // 略偏下
  }

  // ==================== 坐标变换 ====================

  /**
   * 等距坐标 → 屏幕坐标
   * @param {number} tileX - 等距 X（列）
   * @param {number} tileY - 等距 Y（行）
   * @returns {{x: number, y: number}} 屏幕坐标（逻辑像素）
   */
  isoToScreen(tileX, tileY) {
    return {
      x: this.originX + (tileX - tileY) * (this.tileWidth / 2),
      y: this.originY + (tileX + tileY) * (this.tileHeight / 2)
    };
  }

  /**
   * 屏幕坐标 → 等距坐标（用于触摸检测）
   */
  screenToIso(screenX, screenY) {
    const dx = (screenX - this.originX) / (this.tileWidth / 2);
    const dy = (screenY - this.originY) / (this.tileHeight / 2);
    return {
      tileX: (dx + dy) / 2,
      tileY: (dy - dx) / 2
    };
  }

  // ==================== 绘制基元 ====================

  /**
   * 绘制等距菱形（用于地砖、桌面）
   * @param {number} cx - 菱形中心 X（屏幕坐标）
   * @param {number} cy - 菱形中心 Y（屏幕坐标）
   * @param {number} w - 菱形宽度
   * @param {number} h - 菱形高度
   * @param {string} fillColor - 填充色
   * @param {string} strokeColor - 可选描边色
   */
  drawIsoDiamond(cx, cy, w, h, fillColor, strokeColor) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2);       // 上顶点
    ctx.lineTo(cx + w / 2, cy);       // 右顶点
    ctx.lineTo(cx, cy + h / 2);       // 下顶点
    ctx.lineTo(cx - w / 2, cy);       // 左顶点
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  /**
   * 绘制等距 3D 盒子（用于桌子、前台等有厚度的物体）
   * @param {number} cx - 盒子中心 X（屏幕坐标）
   * @param {number} cy - 盒子顶部中心 Y（屏幕坐标）
   * @param {number} w - 宽度
   * @param {number} h - 深度
   * @param {number} height - 盒子高度（垂直方向）
   * @param {string} topColor - 顶面颜色
   * @param {string} leftColor - 左侧面颜色
   * @param {string} rightColor - 右侧面颜色
   */
  drawIsoBox(cx, cy, w, h, height, topColor, leftColor, rightColor) {
    const ctx = this.ctx;
    const hw = w / 2;
    const hh = h / 2;

    // 顶面（菱形）
    this.drawIsoDiamond(cx, cy, w, h, topColor);

    // 左面（从顶面左下到顶面右下，向下延伸 height）
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy);          // 顶面左
    ctx.lineTo(cx, cy + hh);          // 顶面下
    ctx.lineTo(cx, cy + hh + height); // 底面下
    ctx.lineTo(cx - hw, cy + height); // 底面左
    ctx.closePath();
    ctx.fillStyle = leftColor;
    ctx.fill();

    // 右面（从顶面右下到顶面右，向下延伸 height）
    ctx.beginPath();
    ctx.moveTo(cx + hw, cy);          // 顶面右
    ctx.lineTo(cx, cy + hh);          // 顶面下
    ctx.lineTo(cx, cy + hh + height); // 底面下
    ctx.lineTo(cx + hw, cy + height); // 底面右
    ctx.closePath();
    ctx.fillStyle = rightColor;
    ctx.fill();
  }

  /**
   * 绘制等距角色（程序化小人）
   * @param {number} cx - 角色底部中心 X（屏幕坐标）
   * @param {number} cy - 角色底部中心 Y（屏幕坐标）
   * @param {string} bodyColor - 身体/衣服颜色
   * @param {string} skinColor - 皮肤颜色（可选）
   */
  drawIsoCharacter(cx, cy, bodyColor, skinColor) {
    const ctx = this.ctx;
    skinColor = skinColor || '#FFD5B8';

    // 身体（小等距盒子，矮的）
    const bodyW = 16;
    const bodyH = 12;
    const bodyHeight = 14;

    // 身体中心在角色底部上方 bodyHeight/2
    const bodyCY = cy - bodyHeight / 2 - 4;

    this.drawIsoBox(cx, bodyCY, bodyW, bodyH, bodyHeight,
      bodyColor,
      this._darken(bodyColor, 0.7),
      this._darken(bodyColor, 0.55)
    );

    // 头部（圆球效果：在身体上方画圆）
    const headCY = bodyCY - bodyHeight / 2 - 6;
    ctx.beginPath();
    ctx.arc(cx, headCY, 8, 0, Math.PI * 2);
    ctx.fillStyle = skinColor;
    ctx.fill();
    ctx.strokeStyle = this._darken(skinColor, 0.8);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 头发（半圆在头顶）
    ctx.beginPath();
    ctx.arc(cx, headCY - 2, 8, Math.PI, 0);
    ctx.fillStyle = '#333333';
    ctx.fill();
  }

  /**
   * 绘制窗户（带风景的后墙窗户）
   * @param {number} cx - 窗户中心 X（屏幕坐标）
   * @param {number} cy - 窗户中心 Y（屏幕坐标）
   * @param {number} w - 窗户宽度
   * @param {number} h - 窗户高度
   * @param {object} scenery - 风景参数 { timeOfDay: 'day'|'sunset'|'night', weather: 'clear'|'rain'|'snow' }
   */
  drawWindow(cx, cy, w, h, scenery) {
    const ctx = this.ctx;
    scenery = scenery || { timeOfDay: 'day', weather: 'clear' };

    // 窗户背景（天空）
    const skyColors = {
      day: { top: '#87CEEB', bottom: '#B0E0E6' },
      sunset: { top: '#FF7F50', bottom: '#FFDAB9' },
      night: { top: '#191970', bottom: '#2F2F6F' }
    };
    const sky = skyColors[scenery.timeOfDay] || skyColors.day;

    const grad = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx - w / 2, cy + h / 2);
    grad.addColorStop(0, sky.top);
    grad.addColorStop(1, sky.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);

    // 太阳/月亮
    if (scenery.timeOfDay === 'day') {
      this._drawCircle(cx + w * 0.25, cy - h * 0.2, 8, '#FFD700', '#FFA500');
    } else if (scenery.timeOfDay === 'night') {
      this._drawCircle(cx + w * 0.2, cy - h * 0.15, 7, '#F5F5DC', '#E8E8D0');
      // 星星
      for (let i = 0; i < 8; i++) {
        const sx = cx - w / 2 + Math.random() * w;
        const sy = cy - h / 2 + Math.random() * h * 0.6;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    }

    // 云朵（白天和黄昏）
    if (scenery.timeOfDay !== 'night') {
      this._drawCloud(cx - w * 0.15, cy - h * 0.2, 0.6);
      this._drawCloud(cx + w * 0.2, cy + h * 0.05, 0.5);
    }

    // 天气效果
    if (scenery.weather === 'rain') {
      ctx.strokeStyle = 'rgba(174,194,224,0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 15; i++) {
        const rx = cx - w / 2 + Math.random() * w;
        const ry = cy - h / 2 + Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 2, ry + 5);
        ctx.stroke();
      }
    } else if (scenery.weather === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 12; i++) {
        const sx = cx - w / 2 + Math.random() * w;
        const sy = cy - h / 2 + Math.random() * h;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 窗户框（在风景之上）
    const frameColor = '#8B7355';
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);

    // 十字窗框
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx, cy + h / 2);
    ctx.moveTo(cx - w / 2, cy);
    ctx.lineTo(cx + w / 2, cy);
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ==================== 场景渲染 ====================

  /**
   * 清空画布
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  /**
   * 绘制完整场景的辅助：按等距深度排序的遍历
   * @param {function} callback - 每个 tile 的回调 (col, row, screenX, screenY)
   */
  forEachTile(callback) {
    // 从后往前遍历（先画远的行）
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const { x, y } = this.isoToScreen(col, row);
        callback(col, row, x, y);
      }
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 颜色变暗（HSL 降低亮度）
   */
  _darken(hex, factor) {
    let r, g, b;
    if (hex.startsWith('#')) {
      const h = hex.slice(1);
      if (h.length === 3) {
        r = parseInt(h[0] + h[0], 16);
        g = parseInt(h[1] + h[1], 16);
        b = parseInt(h[2] + h[2], 16);
      } else {
        r = parseInt(h.slice(0, 2), 16);
        g = parseInt(h.slice(2, 4), 16);
        b = parseInt(h.slice(4, 6), 16);
      }
    } else { return hex; }

    r = Math.floor(r * factor);
    g = Math.floor(g * factor);
    b = Math.floor(b * factor);
    return `rgb(${r},${g},${b})`;
  }

  _drawCircle(cx, cy, r, fillColor, strokeColor) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  _drawCloud(cx, cy, scale) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy, 10 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 8 * scale, cy - 4 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 16 * scale, cy, 9 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 6 * scale, cy + 2 * scale, 7 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 导出单例
module.exports = new IsoEngine();

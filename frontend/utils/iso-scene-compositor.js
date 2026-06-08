/**
 * 等距场景合成器 — Isometric Scene Compositor
 * 根据参数构建场景树、深度排序、执行绘制
 * 纯程序化绘制，不依赖外部图片
 */

const isoEngine = require('./iso-engine.js');
const { getTemplate } = require('../config/iso-templates.js');

class IsoSceneCompositor {
  constructor() {
    this.template = null;
    this.params = null;
  }

  /**
   * 渲染完整场景
   * @param {object} params - 场景参数
   * @param {string} params.restaurantType - 'sichuan'|'cantonese'|'japanese'|'bbq'
   * @param {number} params.tableCount - 桌子数量
   * @param {Array} params.occupancy - [{tableId, count}] 每桌人数
   * @param {string} params.timeOfDay - 'day'|'sunset'|'night'
   * @param {string} params.weather - 'clear'|'rain'|'snow'
   */
  render(params) {
    this.params = this._normalizeParams(params);
    this.template = getTemplate(this.params.restaurantType);

    // 配置引擎
    const t = this.template;
    isoEngine.setGridSize(t.grid.cols, t.grid.rows);
    isoEngine.setTileSize(t.tile.width, t.tile.height);

    // 清空画布
    isoEngine.clear();

    // 按层绘制
    this._drawBackWall();       // Layer 1: 后墙
    this._drawWindows();         // Layer 2: 窗户 + 风景
    this._drawCeilingLights();   // Layer 3: 灯光
    this._drawFloorAndObjects(); // Layer 4-7: 地板 + 桌子 + 人物 + 前台
    this._drawForeground();      // Layer 8: 前景装饰
  }

  // ==================== 参数规范化 ====================

  _normalizeParams(params) {
    const p = Object.assign({
      restaurantType: 'sichuan',
      tableCount: 6,
      occupancy: [],
      timeOfDay: 'day',
      weather: 'clear'
    }, params);

    // 自动检测时间
    if (!params || !params.timeOfDay) {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 16) p.timeOfDay = 'day';
      else if (hour >= 16 && hour < 19) p.timeOfDay = 'sunset';
      else p.timeOfDay = 'night';
    }

    return p;
  }

  // ==================== 绘制层 ====================

  /**
   * Layer 1: 后墙（含踢脚线和装饰）
   */
  _drawBackWall() {
    const ctx = isoEngine.ctx;
    const t = this.template;
    const w = isoEngine.canvasWidth;
    const h = isoEngine.canvasHeight;

    // 根据最上面一排 tile 计算墙的位置
    const topLeft = isoEngine.isoToScreen(0, 0);
    const topRight = isoEngine.isoToScreen(isoEngine.gridCols - 1, 0);
    const botLeft = isoEngine.isoToScreen(0, 2); // 墙向下延伸 2 行

    // 绘制后墙矩形
    ctx.fillStyle = t.colors.wall;
    ctx.beginPath();
    ctx.moveTo(topLeft.x - 30, topLeft.y - 30);
    ctx.lineTo(topRight.x + 30, topRight.y - 30);
    ctx.lineTo(botLeft.x - 30, botLeft.y + 20);
    ctx.lineTo(topLeft.x - 70, topLeft.y + 20);
    ctx.closePath();
    ctx.fill();

    // 墙裙/踢脚线
    ctx.fillStyle = t.colors.wallTrim;
    const trimBotLeft = isoEngine.isoToScreen(0, 2.2);
    ctx.fillRect(topLeft.x - 50, trimBotLeft.y + 10, topRight.x - topLeft.x + 100, 8);

    // 墙壁装饰（灯笼/霓虹灯牌）
    this._drawWallDecorations(topLeft, topRight);
  }

  /**
   * Layer 2: 窗户 + 动态风景
   */
  _drawWindows() {
    const t = this.template;
    const scenery = {
      timeOfDay: this.params.timeOfDay,
      weather: this.params.weather
    };

    t.windows.forEach(win => {
      const { x, y } = isoEngine.isoToScreen(win.col, win.row);
      isoEngine.drawWindow(x, y - 10, 80, 50, scenery);
    });
  }

  /**
   * Layer 3: 天花板灯光
   */
  _drawCeilingLights() {
    const t = this.template;
    const ctx = isoEngine.ctx;

    t.ceilingLights.forEach(light => {
      const { x, y } = isoEngine.isoToScreen(light.col, light.row);

      // 光晕（径向渐变）
      const grad = ctx.createRadialGradient(x, y - 20, 5, x, y - 20, 60);
      const glowColor = t.colors.lightGlow;
      grad.addColorStop(0, glowColor.replace(')', ',0.4)').replace('rgb', 'rgba'));
      grad.addColorStop(0.3, glowColor.replace(')', ',0.15)').replace('rgb', 'rgba'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 60, y - 80, 120, 100);

      // 灯具本身
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(x, y - 22, 6, 0, Math.PI * 2);
      ctx.fill();

      // 灯线
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - 28);
      ctx.lineTo(x, y - 60);
      ctx.stroke();
    });
  }

  /**
   * Layer 4-7: 地板 + 桌子 + 人物 + 前台
   * 按等距深度逐 tile 绘制，实现正确遮挡
   */
  _drawFloorAndObjects() {
    const t = this.template;

    // 建立桌子位置快速索引
    const tableMap = {};
    const occupiedTables = this.params.occupancy || [];
    const occMap = {};
    occupiedTables.forEach(o => { occMap[o.tableId] = o.count; });

    // 取前 tableCount 张桌子
    const activeTables = t.tablePositions.slice(0, this.params.tableCount);

    activeTables.forEach((tp, idx) => {
      tableMap[`${tp.col},${tp.row}`] = {
        tableId: idx,
        occupantCount: occMap[idx] || Math.floor(Math.random() * 3)
      };
    });

    // 前台位置
    const fdKey = `${t.frontDesk.col},${t.frontDesk.row}`;

    // 逐行逐列绘制（后→前，实现遮挡）
    isoEngine.forEachTile((col, row, screenX, screenY) => {
      const key = `${col},${row}`;

      // 跳过墙的行（row 0-1 是墙壁层）
      if (row < 2) return;

      // 绘制地砖
      const isEven = (col + row) % 2 === 0;
      const floorColor = isEven ? t.colors.floorA : t.colors.floorB;
      isoEngine.drawIsoDiamond(screenX, screenY,
        isoEngine.tileWidth, isoEngine.tileHeight,
        floorColor, t.colors.floorStroke);

      // 如果有桌子在这个 tile 上，绘制桌子
      if (tableMap[key] !== undefined) {
        const td = tableMap[key];
        this._drawTable(screenX, screenY, td.tableId);

        // 绘制人物
        if (td.occupantCount > 0) {
          this._drawCharactersAtTable(screenX, screenY, td.occupantCount, td.tableId + col * 10);
        }
      }

      // 如果有前台在这个 tile 上
      if (key === fdKey) {
        this._drawFrontDesk(screenX, screenY);
      }
    });
  }

  /**
   * 绘制单张桌子（等距 3D 盒子 + 椅子）
   */
  _drawTable(cx, cy, tableId) {
    const t = this.template;

    // 先画椅子（在桌子后面 / 侧面）
    this._drawChair(cx - 18, cy - 4, t.colors.chair);
    this._drawChair(cx + 18, cy - 4, t.colors.chair);
    this._drawChair(cx, cy - 14, t.colors.chair);

    // 桌子主体（等距盒子）
    isoEngine.drawIsoBox(cx, cy - 6, 44, 28, 10,
      t.colors.tableTop,
      t.colors.tableLeft,
      t.colors.tableRight
    );

    // 桌面细节（小圆盘表示餐具位置）
    isoEngine.ctx.fillStyle = 'rgba(255,255,255,0.15)';
    isoEngine.ctx.beginPath();
    isoEngine.ctx.arc(cx - 6, cy - 8, 5, 0, Math.PI * 2);
    isoEngine.ctx.fill();
    isoEngine.ctx.beginPath();
    isoEngine.ctx.arc(cx + 6, cy - 8, 5, 0, Math.PI * 2);
    isoEngine.ctx.fill();
  }

  /**
   * 绘制单把椅子（小等距盒子）
   */
  _drawChair(cx, cy, color) {
    isoEngine.drawIsoBox(cx, cy, 14, 10, 8, color,
      isoEngine._darken(color, 0.7),
      isoEngine._darken(color, 0.55));
  }

  /**
   * 在桌子周围绘制人物
   */
  _drawCharactersAtTable(tableCX, tableCY, count, seed) {
    const t = this.template;
    const colors = t.colors.characterColors;
    const skinColors = ['#FFD5B8', '#F5C5A3', '#E8B898', '#D4A88C'];

    // 不同人数的座位布局
    const positions = [];
    if (count === 1) {
      positions.push({ x: tableCX, y: tableCY - 16 });
    } else if (count === 2) {
      positions.push({ x: tableCX - 16, y: tableCY - 10 });
      positions.push({ x: tableCX + 16, y: tableCY - 10 });
    } else {
      positions.push({ x: tableCX - 16, y: tableCY - 10 });
      positions.push({ x: tableCX + 16, y: tableCY - 10 });
      positions.push({ x: tableCX, y: tableCY - 22 });
    }

    // 按 Y 排序：远的先画
    positions.sort((a, b) => a.y - b.y);

    positions.forEach((pos, i) => {
      const bodyColor = colors[(seed + i) % colors.length];
      const skinColor = skinColors[(seed + i) % skinColors.length];
      isoEngine.drawIsoCharacter(pos.x, pos.y, bodyColor, skinColor);
    });
  }

  /**
   * 绘制前台
   */
  _drawFrontDesk(cx, cy) {
    const t = this.template;

    // 前台主体（宽大的等距盒子）
    isoEngine.drawIsoBox(cx, cy - 4, 56, 32, 18,
      t.colors.frontDeskTop,
      t.colors.frontDeskLeft,
      t.colors.frontDeskRight
    );

    // 前台服务员
    isoEngine.drawIsoCharacter(cx + 18, cy - 6, '#FFFFFF', '#FFD5B8');

    // 前台标识小牌子
    const ctx = isoEngine.ctx;
    ctx.fillStyle = t.colors.wallTrim;
    ctx.fillRect(cx - 16, cy - 24, 32, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('前台', cx, cy - 16);
  }

  /**
   * Layer 8: 前景装饰（盆栽、招牌等）
   */
  _drawForeground() {
    const t = this.template;
    const ctx = isoEngine.ctx;

    if (t.atmosphere && t.atmosphere.plantPositions) {
      t.atmosphere.plantPositions.forEach(pp => {
        const { x, y } = isoEngine.isoToScreen(pp.col, pp.row);
        if (pp.row >= isoEngine.gridRows) return; // 出界不画

        // 简易盆栽：棕色盒子 + 绿色圆形
        isoEngine.drawIsoBox(x, y - 4, 12, 10, 6, '#6B4226', '#4A2E1A', '#5A3622');
        ctx.beginPath();
        ctx.arc(x, y - 14, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#2E8B57';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - 3, y - 16, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#3CB371';
        ctx.fill();
      });
    }
  }

  /**
   * 绘制墙壁装饰
   */
  _drawWallDecorations(topLeft, topRight) {
    const t = this.template;
    const ctx = isoEngine.ctx;
    const decor = t.atmosphere && t.atmosphere.wallDecor;

    if (decor === 'lanterns') {
      // 红灯笼
      const lx1 = topLeft.x + (topRight.x - topLeft.x) * 0.3;
      const lx2 = topLeft.x + (topRight.x - topLeft.x) * 0.7;
      const ly = topLeft.y - 15;
      this._drawLantern(lx1, ly);
      this._drawLantern(lx2, ly);
    } else if (decor === 'neon' || decor === 'neon_red') {
      // 霓虹灯牌
      const mx = topLeft.x + (topRight.x - topLeft.x) / 2;
      ctx.fillStyle = decor === 'neon_red' ? '#FF0000' : '#00FF88';
      ctx.shadowColor = decor === 'neon_red' ? '#FF0000' : '#00FF88';
      ctx.shadowBlur = 10;
      ctx.fillRect(mx - 40, topLeft.y - 25, 80, 15);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.name, mx, topLeft.y - 13);
    } else if (decor === 'noren') {
      // 暖帘
      const mx = topLeft.x + (topRight.x - topLeft.x) / 2;
      ctx.fillStyle = '#2E4053';
      const curtainY = topLeft.y - 15;
      ctx.fillRect(mx - 30, curtainY, 28, 35);
      ctx.fillRect(mx + 2, curtainY, 28, 35);
      ctx.fillStyle = '#F5F0E8';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('らーめん', mx - 16, curtainY + 22);
      ctx.fillText('らーめん', mx + 16, curtainY + 22);
    }
  }

  _drawLantern(x, y) {
    const ctx = isoEngine.ctx;
    // 线
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x, y);
    ctx.stroke();
    // 灯笼体
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // 金色饰边
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 流苏
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 3, y + 20, 6, 6);
  }
}

// 导出单例
module.exports = new IsoSceneCompositor();

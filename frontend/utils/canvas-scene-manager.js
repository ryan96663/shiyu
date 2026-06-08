// Canvas场景管理器
class CanvasSceneManager {
  constructor() {
    this.layout = require('../config/scene-layout.js');
    this.characters = new Map(); // 缓存已加载的人物图片
    this.decorations = new Map(); // 缓存装饰元素
    this.canvas = null;
    this.ctx = null;
    this.currentTheme = '川菜小馆'; // 默认主题
  }

  // 初始化场景管理器
  init(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  // 切换场景主题
  setTheme(themeName) {
    const validThemes = ['川菜小馆', '粤式茶餐厅', '日式拉面馆', '烧烤店'];
    
    if (validThemes.includes(themeName)) {
      this.currentTheme = themeName;
      console.log(`✅ 场景管理器主题已切换到: ${themeName}`);
      return true;
    } else {
      console.warn(`❌ 无效的主题名称: ${themeName}`);
      return false;
    }
  }

  // 预加载所有素材
  async preloadAssets() {
    const promises = [];

    // 预加载人物素材
    const chars = this.layout.characterSettings.availableCharacters;
    const uniqueChars = [...new Set(chars)];
    uniqueChars.forEach(char => {
      promises.push(
        this.loadCharacter(char).catch(err => {
          console.warn(`⚠️ 人物素材 ${char} 加载失败，将使用降级方案:`, err.message);
          return null;
        })
      );
    });

    // 预加载装饰素材（使用实际存在的文件路径）
    promises.push(
      this.loadDecoration('table', '/images/elements/table.png').catch(() => null)
    );
    promises.push(
      this.loadDecoration('chair', '/images/elements/chair.png').catch(() => null)
    );

    // front-desk 和 waiter-avatar 暂无 PNG 素材，使用 Fallback 几何绘制

    try {
      await Promise.all(promises);
      console.log('✅ 场景素材预加载完成');
      return true;
    } catch (error) {
      console.warn('⚠️ 部分场景素材加载失败，使用降级方案:', error.message);
      return true; // 继续运行，使用 fallback
    }
  }

  // 加载人物图片
  async loadCharacter(characterName) {
    return new Promise((resolve, reject) => {
      const imagePath = `/images/sprites/characters/${characterName}.png`;
      
      // 检查是否已缓存
      if (this.characters.has(characterName)) {
        resolve(this.characters.get(characterName));
        return;
      }
      
      // 微信小程序 Canvas 2D API：使用 canvas.createImage()
      const img = this.canvas.createImage();
      img.onload = () => {
        this.characters.set(characterName, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`人物素材加载失败: ${characterName}`);
        reject(new Error(`无法加载人物: ${characterName}`));
      };
      img.src = imagePath;
    });
  }

  // 加载装饰元素
  async loadDecoration(name, path) {
    return new Promise((resolve, reject) => {
      if (this.decorations.has(name)) {
        resolve(this.decorations.get(name));
        return;
      }
      
      // 微信小程序 Canvas 2D API：使用 canvas.createImage()
      const img = this.canvas.createImage();
      img.onload = () => {
        this.decorations.set(name, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`装饰元素加载失败: ${name}`);
        reject(new Error(`无法加载装饰: ${name}`));
      };
      img.src = path;
    });
  }

  // 绘制完整场景
  async drawCompleteScene() {
    if (!this.canvas || !this.ctx) {
      console.error('Canvas未初始化');
      return;
    }
    
    const ctx = this.ctx;
    
    // 清空画布
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Layer 1: 绘制背景
    this.drawBackground(ctx);
    
    // Layer 2: 绘制地板
    this.drawFloor(ctx);
    
    // Layer 3: 绘制灯具
    this.drawLighting(ctx);
    
    // Layer 4: 绘制前台
    this.drawFrontDesk(ctx);
    
    // Layer 5: 绘制所有桌子
    await this.drawAllTables(ctx);
    
    // Layer 6: 绘制人物
    await this.drawAllCharacters(ctx);
    
    // Layer 7: 绘制服务员
    await this.drawWaiter(ctx);
  }

  // 绘制背景
  drawBackground(ctx) {
    const theme = this.currentTheme || '川菜小馆';
    let colors;
    
    // 根据当前主题获取背景颜色
    if (theme === '川菜小馆') {
      colors = { top: '#8B4513', bottom: '#CD853F' };
    } else if (theme === '粤式茶餐厅') {
      colors = { top: '#2F4F4F', bottom: '#708090' };
    } else if (theme === '日式拉面馆') {
      // 日式拉面馆使用纯色背景
      ctx.fillStyle = '#2E2E2E';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    } else if (theme === '烧烤店') {
      colors = { top: '#1C1C1C', bottom: '#4F4F4F' };
    }
    
    if (colors) {
      const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, colors.top);
      gradient.addColorStop(1, colors.bottom);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // 绘制地板
  drawFloor(ctx) {
    const tileSize = 32;
    const { pattern, color1, color2 } = this.layout.decorations.floorTiles;
    
    ctx.save();
    ctx.globalAlpha = 0.3; // 降低地板透明度
    
    if (pattern === 'checkerboard') {
      // 棋盘格图案
      for (let x = 0; x < this.canvas.width; x += tileSize) {
        for (let y = 0; y < this.canvas.height; y += tileSize) {
          const isEven = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
          ctx.fillStyle = isEven ? color1 : color2;
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
    
    ctx.restore();
  }

  // 绘制灯具
  drawLighting(ctx) {
    const { ceilingLights } = this.layout.decorations.lighting;
    
    ceilingLights.forEach(light => {
      // 绘制吊灯
      ctx.save();
      ctx.globalAlpha = 0.6;
      
      // 灯罩
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(light.x, light.y, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // 灯光效果
      const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 50);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(light.x, light.y, 50, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  // 绘制前台
  async drawFrontDesk(ctx) {
    const { frontDesk } = this.layout;
    const deskImage = this.decorations.get('front-desk');
    const theme = this.currentTheme || '川菜小馆';
    let deskColor = '#8B4513';
    
    // 根据主题调整前台颜色
    if (theme === '粤式茶餐厅') {
      deskColor = '#654321';
    } else if (theme === '日式拉面馆') {
      deskColor = '#2F2F2F';
    } else if (theme === '烧烤店') {
      deskColor = '#2F2F2F';
    }
    
    if (deskImage) {
      ctx.drawImage(
        deskImage,
        frontDesk.position.x,
        frontDesk.position.y,
        frontDesk.size.width,
        frontDesk.size.height
      );
    } else {
      // Fallback: 绘制基础前台形状
      ctx.fillStyle = deskColor;
      ctx.fillRect(
        frontDesk.position.x,
        frontDesk.position.y,
        frontDesk.size.width,
        frontDesk.size.height
      );
      
      // 添加装饰纹理
      ctx.strokeStyle = this.adjustColorForTheme(deskColor, -30);
      ctx.lineWidth = 3;
      ctx.strokeRect(frontDesk.position.x, frontDesk.position.y, frontDesk.size.width, frontDesk.size.height);
    }
  }

  // 绘制所有桌子
  async drawAllTables(ctx) {
    const tableImage = this.decorations.get('table');
    
    this.layout.tablePositions.forEach((table, index) => {
      if (tableImage) {
        // 使用图片素材绘制桌子
        ctx.drawImage(
          tableImage,
          table.x,
          table.y,
          table.width,
          table.height
        );
      } else {
        // Fallback: 绘制基础矩形桌子
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(table.x, table.y, table.width, table.height);
        
        // 添加木纹效果
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(table.x, table.y, table.width, table.height);
      }
      
      // 为有人的桌子添加细节
      if (table.occupied) {
        this.drawTableDetails(ctx, table);
      }
    });
  }

  // 绘制桌子细节
  drawTableDetails(ctx, table) {
    // 绘制桌布效果
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(table.x + 5, table.y + 5, table.width - 10, table.height - 10);
    ctx.restore();
    
    // 如果有台灯设置，绘制小台灯
    if (this.layout.decorations.lighting.tableLamp) {
      this.drawTableLamp(ctx, table);
    }
  }

  // 绘制台灯
  drawTableLamp(ctx, table) {
    const lampX = table.x + table.width / 2;
    const lampY = table.y - 10;
    
    // 灯柱
    ctx.fillStyle = '#696969';
    ctx.fillRect(lampX - 2, lampY - 20, 4, 20);
    
    // 灯罩
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.arc(lampX, lampY - 25, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // 灯光效果
    ctx.save();
    ctx.globalAlpha = 0.2;
    const gradient = ctx.createRadialGradient(lampX, lampY - 25, 0, lampX, lampY - 25, 30);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(lampX, lampY - 25, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 绘制所有人物
  async drawAllCharacters(ctx) {
    for (let i = 0; i < this.layout.tablePositions.length; i++) {
      const table = this.layout.tablePositions[i];
      
      if (table.occupied) {
        // 随机生成1-3个人物
        const numCharacters = Math.floor(Math.random() * 3) + 1; // 1-3人
        
        for (let j = 0; j < numCharacters; j++) {
          await this.drawCharacterAtTable(ctx, table, j, numCharacters);
        }
      }
    }
  }

  // 在桌子周围绘制单个角色
  async drawCharacterAtTable(ctx, table, index, totalCharacters) {
    // 随机选择一个人物类型
    const availableChars = this.layout.characterSettings.availableCharacters;
    const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
    
    // 获取人物图片
    let characterImage = this.characters.get(randomChar);
    if (!characterImage) {
      // 如果图片加载失败，使用默认圆形代表
      this.drawDefaultCharacter(ctx, table, index, totalCharacters);
      return;
    }
    
    // 计算人物位置（围绕桌子分布）
    const positions = this.calculateCharacterPositions(table, totalCharacters);
    const pos = positions[index];
    
    // 绘制人物
    const { width, height } = this.layout.characterSettings.characterSize;
    ctx.drawImage(characterImage, pos.x - width/2, pos.y - height/2, width, height);
  }

  // 计算人物位置分布
  calculateCharacterPositions(table, totalCharacters) {
    const positions = [];
    const tableCenterX = table.x + table.width / 2;
    const tableCenterY = table.y + table.height / 2;
    
    // 根据人数计算分布
    if (totalCharacters === 1) {
      // 1个人：站在桌子前面
      positions.push({ x: tableCenterX, y: table.y + table.height + 30 });
    } else if (totalCharacters === 2) {
      // 2个人：站在桌子两侧
      positions.push({ x: table.x - 30, y: tableCenterY });
      positions.push({ x: table.x + table.width + 30, y: tableCenterY });
    } else {
      // 3个人：站在桌子的三侧
      positions.push({ x: tableCenterX, y: table.y + table.height + 30 }); // 前面
      positions.push({ x: table.x - 30, y: tableCenterY - 20 }); // 左面
      positions.push({ x: table.x + table.width + 30, y: tableCenterY - 20 }); // 右面
    }
    
    return positions;
  }

  // 绘制默认人物（图片加载失败时的fallback）
  drawDefaultCharacter(ctx, table, index, totalCharacters) {
    const positions = this.calculateCharacterPositions(table, totalCharacters);
    const pos = positions[index];
    
    // 绘制简单的人物轮廓
    ctx.save();
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // 身体
    ctx.fillRect(pos.x - 10, pos.y + 20, 20, 30);
    ctx.restore();
  }

  // 绘制服务员
  async drawWaiter(ctx) {
    const { frontDesk } = this.layout;
    const waiterImage = this.decorations.get('waiter-avatar');
    
    if (waiterImage) {
      ctx.drawImage(
        waiterImage,
        frontDesk.waiterPosition.x,
        frontDesk.waiterPosition.y,
        60, // 宽度
        80  // 高度
      );
    } else {
      // Fallback: 绘制简单的服务员形象
      this.drawDefaultWaiter(ctx, frontDesk.waiterPosition);
    }
  }

  // 绘制默认服务员
  drawDefaultWaiter(ctx, position) {
    ctx.save();
    
    // 头部
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.arc(position.x + 30, position.y + 15, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // 身体 (白色制服)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(position.x + 18, position.y + 27, 24, 40);
    
    // 装饰领结
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(position.x + 25, position.y + 35, 10, 6);
    
    ctx.restore();
  }

  // 获取场景统计信息
  getSceneStats() {
    const totalTables = this.layout.tablePositions.length;
    const occupiedTables = this.layout.tablePositions.filter(t => t.occupied).length;
    
    return {
      totalTables,
      occupiedTables,
      emptyTables: totalTables - occupiedTables,
      occupancyRate: (occupiedTables / totalTables * 100).toFixed(1) + '%'
    };
  }

  // 根据主题调整颜色
  adjustColorForTheme(color, adjustment) {
    // 简单的颜色调整功能
    try {
      let hex = color;
      if (color.startsWith('#')) {
        hex = color.substring(1);
      }
      
      // 如果颜色是3位，扩展到6位
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      
      // 解析RGB值
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      // 调整颜色
      const newR = Math.max(0, Math.min(255, r + adjustment)).toString(16).padStart(2, '0');
      const newG = Math.max(0, Math.min(255, g + adjustment)).toString(16).padStart(2, '0');
      const newB = Math.max(0, Math.min(255, b + adjustment)).toString(16).padStart(2, '0');
      
      return `#${newR}${newG}${newB}`;
    } catch (error) {
      console.warn(`⚠️ 颜色调整失败: ${color}, 调整值: ${adjustment}`);
      return color;
    }
  }
}

// 导出单例
const sceneManager = new CanvasSceneManager();
module.exports = sceneManager;
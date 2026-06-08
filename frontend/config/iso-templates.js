/**
 * 食遇 Demo 极速版场景素材配置文件
 * 强制拉齐 8x8 逻辑网格，全店铺共享统一像素背景与资源集
 */

const DEMO_TEMPLATES = {
  // 全站30家Mock店铺一键共享的极速渲染标准模板
  standard_demo_scene: {
    name: '食遇像素大厅',
    grid: { cols: 8, rows: 8 },
    
    // 美术提供的空白房间大底图（含烘焙好的天气与基础墙壁地板）
    bgUrl: '/images/restaurant/restaurant.jpg',
    
    // 512x512画布内，8x8菱形地板最北侧(0,0)顶角的绝对像素坐标推荐
    originPixel: { x: 256, y: 150 },
    
    // 完美排布的 8 张核心餐桌位置配置表 (Col/Row 范围 0-7)
    // 预设了不同的落座人数(occupancy)，方便Demo全场景演示
    tablePositions: [
      { col: 1, row: 1, occupancy: 2 }, // 2人桌变体
      { col: 3, row: 1, occupancy: 4 }, // 4人桌变体
      { col: 5, row: 1, occupancy: 0 }, // 空桌
      { col: 1, row: 4, occupancy: 4 }, // 4人桌变体
      { col: 4, row: 4, occupancy: 2 }, // 2人桌变体
      { col: 6, row: 4, occupancy: 2 }, // 2人桌变体
      { col: 2, row: 6, occupancy: 0 }, // 空桌
      { col: 5, row: 6, occupancy: 4 }  // 4人桌变体
    ]
  }
};

module.exports = {
  DEMO_TEMPLATES
};
// foodie-social/frontend/components/restaurant-canvas/restaurant-canvas.js
const { DEMO_TEMPLATES } = require('../../config/iso-templates.js');

Component({
  properties: {
    // 接收从页面传来的当前店铺实时桌位落座状态数据
    currentOccupancyData: {
      type: Array,
      value: [],
      observer: function(newVal) {
        if (newVal && newVal.length > 0) {
          this.syncRealtimeData(newVal);
        }
      }
    }
  },

  data: {
    sceneConfig: DEMO_TEMPLATES.standard_demo_scene,
    renderTables: [],
    baseOffsetX: 256,
    baseOffsetY: 150
  },

  lifetimes: {
    attached() {
      // 初始化 Demo 默认布局
      this.calculateDemoLayout();
    }
  },

  methods: {
    // 核心变体分发算法：根据落座人数与内部ID，精确匹配你文件夹内的实际素材
    getExactAssetPath(occupancy, tableIndex) {
      const basePath = '/images/restaurant/';

      // 状态 1：空桌，直接匹配
      if (occupancy === 0) {
        return basePath + 'table_empty.jpg';
      }

      // 状态 2：2人桌，根据桌号在文件夹的 3 个变体里交错选择
      if (occupancy === 1 || occupancy === 2) {
        const v2Variants = [
          'table-2persons-v1.jpg',
          'table-2persons-v2.jpg',
          'table-2persons-v3.jpg'
        ];
        const variantFile = v2Variants[tableIndex % v2Variants.length];
        return basePath + variantFile;
      }

      // 状态 3：4人桌/多人桌，根据桌号在文件夹的 3 个大桌变体里交错选择
      if (occupancy > 2) {
        const v4Variants = [
          'table-4persons-v1.jpg',
          'table-4persons-v2.jpg',
          'table-4persons-v3.jpg' // 完美匹配你给出的带有不规则破折号的真实文件名
        ];
        const variantFile = v4Variants[tableIndex % v4Variants.length];
        return basePath + variantFile;
      }

      // 极端异常状态兜底，确保不会穿帮显示不出来
      return basePath + 'table_empty.jpg';
    },

    // 计算 Demo 绝对定位坐标体系
    calculateDemoLayout() {
      const template = this.data.sceneConfig;
      const tileWidth = 64;
      const tileHeight = 32;
      
      const renderTables = template.tablePositions.map((item, index) => {
        // 2.5D 高维数学投影
        const screenX = (item.col - item.row) * (tileWidth / 2);
        const screenY = (item.col + item.row) * (tileHeight / 2);

        return {
          id: index,
          left: template.originPixel.x + screenX,
          top: template.originPixel.y + screenY,
          zIndex: item.row * 100 + item.col, // 简易 DOM 深度剔除
          occupancy: item.occupancy,
          imgUrl: this.getExactAssetPath(item.occupancy, index) // 注入分发路径
        };
      });

      this.setData({ renderTables });
    },

    // 接收后端 WebSocket 或 API 的真实状态更新（当用户在群聊里真实入座时触发）
    syncRealtimeData(realtimeStatusArray) {
      // realtimeStatusArray 结构示例: [{id: 0, occupancy: 4}, {id: 1, occupancy: 0}]
      let currentTables = [...this.data.renderTables];
      
      realtimeStatusArray.forEach(status => {
        if (currentTables[status.id]) {
          currentTables[status.id].occupancy = status.occupancy;
          currentTables[status.id].imgUrl = this.getExactAssetPath(status.occupancy, status.id);
        }
      });

      this.setData({ renderTables: currentTables });
    },

    onTableTap(e) {
      const { id } = e.currentTarget.dataset;
      this.triggerEvent('tableSelect', { id, occupancy: this.data.renderTables[id].occupancy });
    }
  }
});

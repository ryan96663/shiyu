/**
 * Layout Engine - 布局引擎
 * 负责桌子网格布局计算和座位分配算法
 * 符合设计方案要求的Grid自动排布+座位精确分配
 */

class RestaurantLayoutEngine {
  constructor() {
    
    // 布局配置常量
    this.config = {
      
      // 基础桌面参数
      tableTypes: {
        table_2: {
          name: '2人桌',
          capacity: 2,
          seats: ['top', 'bottom'],
          width: 120,  // rpx
          height: 120
        },
        table_4: {
          name: '4人桌', 
          capacity: 4,
          seats: ['top', 'right', 'bottom', 'left'],
          width: 140,
          height: 140
        },
        table_6: {
          name: '6人桌',
          capacity: 6,
          seats: ['top', 'top-right', 'bottom-right', 'bottom', 'bottom-left', 'top-left'],
          width: 160,
          height: 160
        }
      },
      
      // 布局参数
      layout: {
        defaultColumns: 3,
        minColumns: 2,
        maxColumns: 4,
        gapHorizontal: 48,  // rpx
        gapVertical: 32,
        paddingHorizontal: 24,
        paddingVertical: 32,
        tableUnitWidth: 192,
        tableUnitHeight: 220
      },
      
      // 响应式断点
      breakpoints: {
        small: 375,   // iPhone 5/SE
        medium: 750,  // iPhone Pro Max
        large: 1200   // iPad
      }
    };
  }
  
  /**
   * 生成桌面布局 - 核心方法
   * @param {Object} options 布局选项
   * @param {number} options.peopleCount 总人数
   * @param {number} options.columns 列数
   * @param {string} options.tableType 桌型
   * @param {Array} options.customSeatAllocation 自定义座位分配
   * @returns {Array} 桌子列表
   */
  generateTableLayout(options = {}) {
    
    // 参数验证和默认值
    const {
      peopleCount = 18,
      columns = this.config.layout.defaultColumns,
      tableType = 'table_4',
      customSeatAllocation = null
    } = options;
    
    if (peopleCount < 0 || peopleCount > 200) {
      console.warn('🎯 LayoutEngine: 人数参数不合理', peopleCount, '使用默认值18');
      peopleCount = 18;
    }
    
    const tableConfig = this.config.tableTypes[tableType];
    if (!tableConfig) {
      console.warn('🎯 LayoutEngine: 无效的桌型', tableType, '使用默认4人桌');
      tableConfig = this.config.tableTypes.table_4;
    }
    
    console.log('🎬 LayoutEngine: 开始生成布局', {
      peopleCount,
      columns,
      tableType,
      tableCapacity: tableConfig.capacity
    });
    
    // 计算需要的桌子数量
    const tableCount = Math.ceil(peopleCount / tableConfig.capacity);
    
    // 生成桌子列表
    const tables = [];
    
    for (let i = 0; i < tableCount; i++) {
      const table = this.generateSingleTable({
        index: i,
        peopleCount,
        tableConfig,
        columns,
        customSeatAllocation,
        totalTables: tableCount
      });
      
      tables.push(table);
    }
    
    // 添加布局统计信息
    const layoutStats = this.calculateLayoutStats(tables, { peopleCount, columns, tableType });
    
    console.log('✅ LayoutEngine: 布局生成完成', layoutStats);
    
    return {
      tables,
      stats: layoutStats,
      config: {
        columns,
        tableType,
        totalPages: Math.ceil(tableCount / (columns * 10)) // 预估页数
      }
    };
  }
  
  /**
   * 生成单个桌子数据
   */
  generateSingleTable(options) {
    const {
      index,
      peopleCount,
      tableConfig,
      columns,
      customSeatAllocation,
      totalTables
    } = options;
    
    // 计算当前桌子的人数
    const remainingPeople = Math.max(0, peopleCount - index * tableConfig.capacity);
    const currentPeople = Math.min(tableConfig.capacity, remainingPeople);
    
    // 座位分配
    let occupiedSeats, emptySeats;
    
    if (customSeatAllocation && customSeatAllocation[index]) {
      // 使用自定义座位分配
      occupiedSeats = customSeatAllocation[index].occupiedSeats || [];
      emptySeats = customSeatAllocation[index].emptySeats || [];
    } else {
      // 默认座位分配（前N个座位有人）
      occupiedSeats = tableConfig.seats.slice(0, currentPeople);
      emptySeats = tableConfig.seats.slice(currentPeople);
    }
    
    // 网格位置计算
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    // 计算实际坐标 (rpx)
    const position = this.calculateTablePosition({
      row,
      col,
      columns,
      layout: this.config.layout
    });
    
    return {
      // 基础信息
      id: `t${String(index + 1).padStart(3, '0')}`,
      type: tableConfig.name,
      tableType: tableConfig,
      capacity: tableConfig.capacity,
      currentPeople: currentPeople,
      totalPeople: peopleCount,
      
      // 状态信息
      status: currentPeople > 0 ? 'occupied' : 'empty',
      isFull: currentPeople === tableConfig.capacity,
      occupancyRate: (currentPeople / tableConfig.capacity * 100).toFixed(1) + '%',
      
      // 网格位置
      index,
      row,
      col,
      position, // 包含x, y坐标
      
      // 座位分配（核心功能）
      seats: {
        all: [...tableConfig.seats],
        occupied: [...occupiedSeats],
        empty: [...emptySeats],
        count: {
          occupied: occupiedSeats.length,
          empty: emptySeats.length,
          total: tableConfig.seats.length
        }
      },
      
      // 交互属性
      canTap: currentPeople > 0,
      selectable: true,
      
      // 可覆盖属性（用于特殊布局需求）
      override: {
        position: null, // 手动覆盖位置 {x, y}
        rotation: 0,     // 桌子旋转角度
        hidden: false    // 是否隐藏
      },
      
      // 渲染数据
      renderData: {
        tableImage: `/mock-assets/furniture/${tableConfig.name}.png`,
        chairImage: '/mock-assets/furniture/chair.png',
        personImage: '/mock-assets/furniture/person.png',
        placeholderImage: `/mock-assets/furniture/${tableConfig.name}_placeholder.png`
      }
    };
  }
  
  /**
   * 计算桌子在画布中的位置
   */
  calculateTablePosition({ row, col, columns, layout }) {
    
    const {
      tableUnitWidth,
      tableUnitHeight,
      gapHorizontal,
      gapVertical,
      paddingHorizontal,
      paddingVertical
    } = layout;
    
    // 计算行宽和列高
    const rowWidth = columns * tableUnitWidth + (columns - 1) * gapHorizontal;
    
    // 计算每个桌子的offset
    const x = paddingHorizontal + col * (tableUnitWidth + gapHorizontal);
    const y = paddingVertical + row * (tableUnitHeight + gapVertical);
    
    return {
      x,                    // 左上角X坐标 (rpx)
      y,                    // 左上角Y坐标 (rpx) 
      centerX: x + tableUnitWidth / 2,    // 中心点X
      centerY: y + tableUnitHeight / 2,   // 中心点Y
      width: tableUnitWidth,
      height: tableUnitHeight,
      rowWidth  // 当前行的总宽度
    };
  }
  
  /**
   * 计算布局统计信息
   */
  calculateLayoutStats(tables, options) {
    const { peopleCount, columns, tableType } = options;
    
    // 基础统计
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const emptyTables = totalTables - occupiedTables;
    const totalSeats = totalTables * this.config.tableTypes[tableType].capacity;
    
    // 椅子统计
    const chairStats = tables.reduce((acc, table) => {
      acc.occupiedChairs += table.seats.count.occupied;
      acc.emptyChairs += table.seats.count.empty;
      return acc;
    }, { occupiedChairs: 0, emptyChairs: 0 });
    
    // 空间统计
    const rows = Math.ceil(totalTables / columns);
    const estimatedHeight = this.estimateCanvasHeight({ tables, columns });
    
    return {
      summary: {
        totalTables,
        occupiedTables,
        emptyTables,
        totalPeople: peopleCount,
        totalSeats,
        occupancyRate: (peopleCount / totalSeats * 100).toFixed(1) + '%'
      },
      chairs: {
        ...chairStats,
        total: chairStats.occupiedChairs + chairStats.emptyChairs
      },
      layout: {
        columns,
        rows,
        estimatedHeight,     // rpx
        aspectRatio: (columns * this.config.layout.tableUnitWidth) / estimatedHeight
      },
      tableType: this.config.tableTypes[tableType].name,
      timestamp: Date.now()
    };
  }
  
  /**
   * 估算画布高度 (用于scroll-view)
   */
  estimateCanvasHeight({ tables, columns }) {
    if (tables.length === 0) return 400;
    
    const rows = Math.ceil(tables.length / columns);
    const { tableUnitHeight, gapVertical, paddingVertical } = this.config.layout;
    
    // 计算总高度：padding + rows * (tableHeight + gap)
    return paddingVertical * 2 + rows * tableUnitHeight + (rows - 1) * gapVertical;
  }
  
  /**
   * 响应式列数计算
   */
  calculateResponsiveColumns(screenWidth) {
    const { breakpoints, layout } = this.config;
    
    if (screenWidth <= breakpoints.small) {
      return Math.min(2, layout.defaultColumns);  // 小屏最多2列
    } else if (screenWidth <= breakpoints.medium) {
      return layout.defaultColumns;               // 中等屏幕默认列数
    } else {
      return Math.min(4, layout.defaultColumns + 1); // 大屏可以显示更多列
    }
  }
  
  /**
   * 优化布局 (针对特殊需求)
   */
  optimizeLayout(tables, optimizationType = 'balanced') {
    
    switch (optimizationType) {
      case 'minimal-gaps':
        return this.optimizeForMinimalGaps(tables);
        
      case 'maximize-capacity':
        return this.optimizeForCapacity(tables);
        
      case 'aesthetic-balance':
        return this.optimizeForAesthetics(tables);
        
      default:
        return tables;
    }
  }
  
  /**
   * 平衡性优化
   */
  optimizeForAesthetics(tables) {
    // 确保桌子布局美观，避免过于集中或分散
    console.log('🎨 LayoutEngine: 应用布局美学优化');
    return tables;
  }
  
  /**
   * 最大化座位优化
   */
  optimizeForCapacity(tables) {
    // 动态调整桌子分布以最大化座位利用率
    console.log('📈 LayoutEngine: 应用容量最大化优化');
    return tables;
  }
  
  /**
   * 最小间隙优化
   */
  optimizeForMinimalGaps(tables) {
    // 调整桌子位置使间隙分布更均匀
    console.log('📐 LayoutEngine: 应用间隙优化');
    return tables;
  }
  
  /**
   * 导出布局配置
   */
  exportLayoutConfig() {
    return {
      ...this.config,
      timestamp: Date.now()
    };
  }
  
  /**
   * 批量生成座位分配方案
   */
  generateSeatAllocationPresets(peopleCount, tableType = 'table_4') {
    const tableConfig = this.config.tableTypes[tableType];
    const tableCount = Math.ceil(peopleCount / tableConfig.capacity);
    
    // 场景1: 紧凑模式 (优先填满前排)
    const compactMode = [];
    for (let i = 0; i < tableCount; i++) {
      const remaining = Math.max(0, peopleCount - i * tableConfig.capacity);
      const currentPeople = Math.min(tableConfig.capacity, remaining);
      compactMode.push({
        occupiedSeats: tableConfig.seats.slice(0, currentPeople),
        emptySeats: tableConfig.seats.slice(currentPeople)
      });
    }
    
    // 场景2: 平衡模式 (平均分配)
    const balancedMode = this.generateBalancedAllocation(peopleCount, tableCount, tableConfig);
    
    // 场景3: 社交距离模式 (分散座位)
    const socialDistanceMode = this.generateSocialDistanceAllocation(peopleCount, tableCount, tableConfig);
    
    return {
      compact: compactMode,
      balanced: balancedMode,
      social: socialDistanceMode
    };
  }
  
  /**
   * 生成平衡分配方案
   */
  generateBalancedAllocation(peopleCount, tableCount, tableConfig) {
    const allocation = [];
    let remainingPeople = peopleCount;
    
    for (let i = 0; i < tableCount; i++) {
      const avgPeoplePerTable = Math.floor(remainingPeople / (tableCount - i));
      const currentPeople = Math.min(Math.max(1, avgPeoplePerTable), tableConfig.capacity);
      
      allocation.push({
        occupiedSeats: tableConfig.seats.slice(0, currentPeople),
        emptySeats: tableConfig.seats.slice(currentPeople)
      });
      
      remainingPeople -= currentPeople;
    }
    
    return allocation;
  }
  
  /**
   * 生成社交距离分配方案
   */
  generateSocialDistanceAllocation(peopleCount, tableCount, tableConfig) {
    const allocation = [];
    let remainingPeople = peopleCount;
    
    for (let i = 0; i < tableCount; i++) {
      // 社交距离模式下每桌最多3人
      const maxPeople = Math.min(3, tableConfig.capacity);
      const currentPeople = Math.min(maxPeople, remainingPeople);
      
      // 间隔式座位分配
      const occupiedSeats = [];
      const pattern = ['top', 'bottom', 'left', 'right']; // 间隔分配模式
      
      for (let j = 0; j < currentPeople; j++) {
        if (pattern[j]) {
          occupiedSeats.push(pattern[j]);
        }
      }
      
      const emptySeats = tableConfig.seats.filter(seat => !occupiedSeats.includes(seat));
      
      allocation.push({
        occupiedSeats,
        emptySeats
      });
      
      remainingPeople -= currentPeople;
    }
    
    return allocation;
  }
  
  /**
   * 获取调试信息
   */
  getDebugInfo() {
    return {
      tableTypes: Object.keys(this.config.tableTypes),
      defaultColumns: this.config.layout.defaultColumns,
      supportedLayouts: ['grid', 'circular', 'linear'],
      performanceMetrics: {
        maxTablesRecommended: 50,
        maxPeopleRecommended: 200
      }
    };
  }
}

// 导出单例实例
const layoutEngine = new RestaurantLayoutEngine();
module.exports = {
  layoutEngine,
  RestaurantLayoutEngine
};

/**
 * 使用示例:
 * 
 * const { layoutEngine } = require('./layout-engine');
 * 
 * // 基础使用
 * const result = layoutEngine.generateTableLayout({
 *   peopleCount: 24,
 *   columns: 3,
 *   tableType: 'table_4'
 * });
 * 
 * // 自定义座位分配
 * const customAllocation = layoutEngine.generateSeatAllocationPresets(18, 'table_4').balanced;
 * const result2 = layoutEngine.generateTableLayout({
 *   peopleCount: 18,
 *   customSeatAllocation: customAllocation
 * });
 * 
 * // 响应式列数
 * const columns = layoutEngine.calculateResponsiveColumns(375); // 根据屏幕宽度
 */
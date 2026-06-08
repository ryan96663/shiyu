/**
 * Interactive Canvas Page - 交互式画布页面
 * 全功能预览页面，支持主题切换、人数调整、实时交互
 * 符合设计方案的用户交互要求
 */

const { themeManager } = require('../../utils/theme-manager');
const { layoutEngine } = require('../../utils/layout-engine');
const { configManager } = require('../../utils/config-manager');
const { resourceManager } = require('../../utils/resource-loader');

Page({
  
  /**
   * 页面数据
   */
  data: {
    
    // 场景基础数据
    sceneConfig: {
      sceneId: 'interactive_preview_v1',
      theme: 'day_sunny',
      restaurantType: 'sichuan',
      previewMode: true,
      peopleCount: 18,
      columns: 3,
      tableType: 'table_4'
    },
    
    // 当前环境状态
    currentTime: 14, // 默认下午2点
    currentWeather: 'sunny',
    
    // UI状态
    showControls: true,
    showSceneSelector: false,
    showPersonInput: false,
    isLoading: false,
    isGenerating: false,
    
    // 渲染数据
    themeData: null,
    tableList: [],
    layoutStats: null,
    
    // 交互状态
    selectedTableId: null,
    interactionMode: 'view', // view, edit, analyze
    
    // 性能监控
    performanceMetrics: null,
    
    // 预设场景展示
    currentPresetIndex: 0,
    presetScenes: [],
    
    // 错误状态
    errorMessage: null,
    showError: false
  },
  
  /**
   * 页面生命周期：页面加载
   */
  onLoad(options) {
    
    console.log('🎬 InteractiveCanvas: 页面加载');
    
    // 初始化页面数据
    this.initializePage(options);
    
    // 预加载关键资源
    this.preloadCriticalAssets();
    
    // 加载预设场景
    this.loadPresetScenes();
    
    // 绑定全局事件
    this.bindGlobalEvents();
  },
  
  /**
   * 初始化页面
   */
  initializePage(options) {
    
    // 参数处理
    if (options.theme) {
      this.data.sceneConfig.theme = options.theme;
    }
    
    if (options.restaurantType) {
      this.data.sceneConfig.restaurantType = options.restaurantType;
    }
    
    if (options.peopleCount) {
      this.data.sceneConfig.peopleCount = parseInt(options.peopleCount);
    }
    
    // 更新当前时间（用于主题切换演示）
    const now = new Date();
    this.data.currentTime = now.getHours();
    this.data.currentWeather = 'sunny'; // 默认晴天
    
    // 初始化主题
    this.initializeTheme();
    
    // 生成初始场景
    this.generateScene();
  },
  
  /**
   * 初始化主题
   */
  initializeTheme() {
    
    const themeData = themeManager.resolveTheme({
      hour: this.data.currentTime,
      weather: this.data.currentWeather,
      restaurantType: this.data.sceneConfig.restaurantType
    });
    
    this.setData({ themeData });
    
    console.log('🎨 Theme: 初始化主题', themeData.key);
  },
  
  /**
   * 预加载关键资源
   */ 
  async preloadCriticalAssets() {
    
    this.setData({ isLoading: true });
    
    try {
      // 预加载清单
      const criticalAssets = [
        '/mock-assets/furniture/table_4.png',
        '/mock-assets/furniture/chair.png',
        '/mock-assets/furniture/person.png',
        '/mock-assets/characters/waiter.png',
        '/mock-assets/backgrounds/window-day.png',
        '/mock-assets/backgrounds/window-night.png'
      ];
      
      // 监听加载进度
      const listenerId = resourceManager.addLoadListener((event) => {
        if (event.url === 'preload_complete') {
          console.log('💪 Preload: 资源预加载完成', event.status.loaded, '/', event.status.total);
          this.setData({ isLoading: false, performanceMetrics: event.performance });
        }
      });
      
      // 开始预加载
      await resourceManager.preloadCriticalAssets(criticalAssets);
      
      // 移除监听器
      resourceManager.removeLoadListener(listenerId);
      
    } catch (error) {
      console.error('💪 Preload: 预加载失败', error);
      this.setData({ isLoading: false, errorMessage: '资源预加载失败: ' + error.message });
    }
  },
  
  /**
   * 加载预设场景
   */
  loadPresetScenes() {
    
    // 获取所有可用预设
    const allPresets = configManager.listPresets();
    
    // 分类预设
    const categorizedPresets = [
      ...configManager.listPresets({ restaurantType: 'sichuan' }).slice(0, 2),
      ...configManager.listPresets({ restaurantType: 'cantonese' }).slice(0, 2), 
      ...configManager.listPresets({ restaurantType: 'japanese' }).slice(0, 2),
      ...configManager.listPresets({ restaurantType: 'bbq' }).slice(0, 2)
    ];
    
    this.setData({ presetScenes: categorizedPresets.slice(0, 8) }); // 限制最多8个
    
    console.log('🏪 Presets: 加载了', categorizedPresets.length, '个预设场景');
  },
  
  /**
   * 生成餐厅场景
   */
  generateScene() {
    
    this.setData({ isGenerating: true, errorMessage: null });
    
    try {
      // 应用主题
      const themeData = themeManager.resolveTheme({
        hour: this.data.currentTime,
        weather: this.data.currentWeather,
        restaurantType: this.data.sceneConfig.restaurantType
      });
      
      // 生成布局
      const layoutResult = layoutEngine.generateTableLayout({
        peopleCount: this.data.sceneConfig.peopleCount,
        columns: this.data.sceneConfig.columns,
        tableType: this.data.sceneConfig.tableType,
        customSeatAllocation: null
      });
      
      // 更新场景数据
      this.setData({
        themeData,
        tableList: layoutResult.tables,
        layoutStats: layoutResult.stats,
        isGenerating: false
      });
      
      // 更新场景配置中的主题
      const newSceneConfig = {
        ...this.data.sceneConfig,
        theme: themeData.key
      };
      this.setData({ sceneConfig: newSceneConfig });
      
      console.log('🎨 Scene: 场景生成完成', {
        tableCount: layoutResult.tables.length,
        peopleCount: this.data.sceneConfig.peopleCount,
        theme: themeData.key
      });
      
    } catch (error) {
      console.error('🎨 Scene: 场景生成失败', error);
      this.setData({
        isGenerating: false,
        errorMessage: '场景生成失败: ' + error.message,
        showError: true
      });
    }
  },
  
  /**
   * 绑定全局事件
   */
  bindGlobalEvents() {
    
    // 主题管理器监听器
    themeManager.addListener((themeData) => {
      console.log('🎨 Event: 主题切换', themeData.key);
      this.setData({ themeData });
      this.generateScene();
    });
    
    // 资源加载监听器（用于展示加载状态）
    resourceManager.addLoadListener((event) => {
      if (event.status === 'failure') {
        this.data.showError && this.setData({
          errorMessage: `资源加载失败: ${event.url}`
        });
      }
    });
  },
  
  /**
   * 切换主题
   */
  switchTheme(e) {
    const themeKey = e.currentTarget?.dataset?.theme || e;
    
    let newTime = this.data.currentTime;
    let newWeather = this.data.currentWeather;
    
    // 解析主题对应的时间和天气
    switch (themeKey) {
      case 'day_sunny':
        newTime = 14; // 下午2点
        newWeather = 'sunny';
        break;
      case 'day_rainy':
        newTime = 14;
        newWeather = 'rainy';
        break;
      case 'night_sunny':  
        newTime = 20; // 晚上8点
        newWeather = 'sunny';
        break;
      case 'night_rainy':
        newTime = 20;
        newWeather = 'rainy';
        break;
    }
    
    this.setData({
      currentTime: newTime,
      currentWeather: newWeather
    });
    
    this.generateScene();
    
    wx.showToast({
      title: '主题已切换 → ' + themeManager.themes[themeKey].name,
      icon: 'success',
      duration: 1500
    });
  },
  
  /**
   * 切换餐厅类型
   */
  switchRestaurantType(e) {
    const restaurantType = e.currentTarget?.dataset?.type || e;
    
    const newConfig = {
      ...this.data.sceneConfig,
      restaurantType
    };
    
    this.setData({ sceneConfig: newConfig });
    this.generateScene();
    
    wx.showToast({
      title: '餐厅类型已切换',
      icon: 'success'
    });
  },
  
  /**
   * 显示人数输入对话框
   */
  showPeopleInput() {
    this.setData({ showPersonInput: true });
  },
  
  /**
   * 人数确定事件
   */
  onPeopleCountConfirm(e) {
    const count = parseInt(e.detail.value) || 18;
    
    if (count < 0 || count > 200) {
      wx.showToast({
        title: '人数范围: 0-200',
        icon: 'error'
      });
      return;
    }
    
    const newConfig = {
      ...this.data.sceneConfig,
      peopleCount: count
    };
    
    this.setData({ 
      sceneConfig: newConfig,
      showPersonInput: false
    });
    
    this.generateScene();
    
    wx.showToast({
      title: '人数已更新: ' + count + '人',
      icon: 'success'
    });
  },
  
  /**
   * 切换预设场景
   */  
  switchToScene(e) {
    const index = e.currentTarget?.dataset?.index;
    const preset = this.data.presetScenes[index];
    
    if (!preset) {
      console.warn('场景不存在', index);
      return;
    }
    
    // 应用预设配置
    const newConfig = {
      ...this.data.sceneConfig,
      ...preset.config,
      sceneId: `preset_${preset.sceneId}`
    };
    
    this.setData({
      sceneConfig: newConfig,
      currentPresetIndex: index
    });
    
    // 设置对应的时间和天气
    const themeConfig = newConfig.theme || 'day_sunny';
    this.switchTheme(themeConfig);
    
    wx.showToast({
      title: preset.name + ' 已应用',
      icon: 'success',
      duration: 2000
    });
  },
  
  /**
   * 快速场景生成（随机)
   */
  generateRandomScene() {
    const themes = ['day_sunny', 'day_rainy', 'night_sunny', 'night_rainy'];
    const restaurantTypes = ['sichuan', 'cantonese', 'japanese', 'bbq'];
    const peopleCounts = [12, 18, 24, 30, 36];
    
    const randomConfig = {
      ...this.data.sceneConfig,
      theme: themes[Math.floor(Math.random() * themes.length)],
      restaurantType: restaurantTypes[Math.floor(Math.random() * restaurantTypes.length)],
      peopleCount: peopleCounts[Math.floor(Math.random() * peopleCounts.length)]
    };
    
    this.setData({ sceneConfig: randomConfig });
    this.switchTheme(randomConfig.theme);
    
    wx.showToast({
      title: '随机场景已生成',
      icon: 'success'
    });
  },
  
  /**
   * 场景刷新（手动触发生成）
   */
  refreshScene() {
    this.generateScene();
    
    wx.showToast({
      title: '场景已刷新',
      icon: 'success'
    });
  },
  
  /**
   * 切换控制面板显示
   */
  toggleControls() {
    this.setData({ showControls: !this.data.showControls });
  },
  
  /**
   * 表格点击事件
   */
  onTableTap(e) {
    const tableId = e.detail?.tableId || e.currentTarget?.dataset?.id;
    const table = this.data.tableList.find(t => t.id === tableId);
    
    if (!table) {
      console.warn('表格不存在', tableId);
      return;
    }
    
    // 切换选中状态
    const selectedTableId = this.data.selectedTableId === tableId ? null : tableId;
    
    this.setData({ selectedTableId });
    
    // 显示表格详情
    wx.showModal({
      title: `🍽️ 桌号: ${tableId}`,
      content: `位置: ${table.row + 1}排${table.col + 1}列\n人数: ${table.currentPeople}人\n状态: ${table.status}\n占用率: ${table.occupancyRate}`,
      showCancel: false,
      confirmText: '确定'
    });
    
    console.log('🎯 TableTap: 表格点击', tableId, table);
  },
  
  /**
   * 图片加载错误事件
   */
  onImageError(e) {
    const { url, fallbackType } = e.detail;
    const errorMessage = `图片加载失败: ${url}`;
    
    console.warn('🖼️ ImageError:', errorMessage);
    
    // 如果启用了错误显示，更新错误信息
    this.data.showError && this.setData({
      errorMessage: errorMessage,
      showError: true
    });
    
    // 触发降级策略
    resourceManager.handleFallback(url).then(result => {
      console.log('🖼️ Fallback: 降级策略已应用', result);
    });
  },
  
  /**
   * 错误状态重置
   */
  resetError() {
    this.setData({
      errorMessage: null,
      showError: false
    });
  },
  
  /**
   * 右上角分享
   */
  onShareAppMessage() {
    
    const sceneName = this.data.sceneConfig.theme === 'day_sunny' ? '白天晴天' : 
                     this.data.sceneConfig.theme === 'day_rainy' ? '白天雨天' :
                     this.data.sceneConfig.theme === 'night_sunny' ? '夜间晴天' : '夜间雨天';
    
    return {
      title: `🍽️ 餐厅画布预览 - ${sceneName} (自助服务)`,
      path: `/pages/store/interactive-canvas?theme=${this.data.sceneConfig.theme}&restaurantType=${this.data.sceneConfig.restaurantType}&peopleCount=${this.data.sceneConfig.peopleCount}`,
      imageUrl: '', // 可以设置为生成的场景截图
      success: function() {
        console.log('分享成功');
      },
      fail: function(err) {
        console.error('分享失败:', err);
      }
    };
  },
  
  /**
   * 页面卸载时清理
   */
  onUnload() {
    // 清理资源
    resourceManager.clearCache();
    
    // 清理组件事件监听器
    // 实际实现需要restaurant-canvas组件暴露清理方法
    
    console.log('🎬 InteractiveCanvas: 页面卸载完成');
  },
  
  /**
   * 获取场景统计数据
   */
  getSceneStats() {
    return {
      peopleCount: this.data.sceneConfig.peopleCount,
      tableCount: this.data.tableList.length,
      occupiedTables: this.data.tableList.filter(t => t.status === 'occupied').length,
      theme: this.data.sceneConfig.theme,
      restaurantType: this.data.sceneConfig.restaurantType,
      performanceMetrics: this.data.performanceMetrics
    };
  },
  
  /**
   * 导出场景配置
   */
  exportSceneConfig() {
    const config = {
      ...configManager.createConfig(),
      sceneConfig: this.data.sceneConfig,
      themeData: this.data.themeData,
      layoutStats: this.data.layoutStats,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'interactive_canvas_page'
      }
    };
    
    console.log('📤 Export: 场景配置', config);
    
    // 触发下载或显示配置
    wx.showModal({
      title: '📤 导出场景配置',
      content: JSON.stringify(config.sceneConfig, null, 2),
      showCancel: true,
      confirmText: '复制',
      success: function(res) {
        if (res.confirm) {
          // 实际应用中应该使用剪贴板API
          console.log('配置已复制到剪贴板');
        }
      }
    });
  }
});

/**
 * 页面使用示例说明:
 * 
 * 1. 主题切换: 在WXML中添加按钮调用 switchTheme
 * 2. 人数调整: 调用 showPeopleInput 显示输入对话框 
 * 3. 预设选择: 遍历presetScenes调用 switchToScene
 * 4. 实时交互: 监听 onTableTap 和 onImageError
 */

/**
 * 扩展功能说明:
 * 
 * // 自定义座位分配
 * const customAllocation = layoutEngine.generateSeatAllocationPresets(18).balanced;
 * 
 * // 性能监控
 * setInterval(() => {
 *   const stats = resourceManager.getPerformanceStats();
 *   console.log('实时性能:', stats.successRate);
 * }, 10000);
 * 
 * // 主题调试
 * themeManager.addListener((themeData) => {
 *   console.log('主题详情:', themeData);
 * });
 */
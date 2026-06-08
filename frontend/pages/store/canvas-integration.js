// Canvas 集成示例代码
// 如何将Canvas场景系统集成到你的店铺详情页

// 引入必要的模块
const SceneLoader = require('../../utils/scene-loader');

Page({
  data: {
    // 场景相关数据
    currentTheme: '川菜小馆',        // 当前主题
    showThemeSelector: false,        // 是否显示主题选择器
    isSceneReady: false,             // Scene是否准备好
    sceneLoading: false,             // 是否正在加载场景
    sceneError: null,                // 错误信息
    
    // 场景统计
    sceneStats: {
      totalTables: 0,
      occupiedTables: 0,
      emptyTables: 0,
      occupancyRate: '0%'
    }
  },

  // ========== 页面生命周期 ==========

  onLoad(options) {
    console.log('🎨 店铺页面加载');
    
    // 初始化场景系统
    this.initCanvasScene();
  },

  onReady() {
    console.log('🎨 页面准备完成');
    // 页面渲染完成后可以执行一些额外的初始化
  },

  onUnload() {
    console.log('🎨 页面卸载, 清理资源');
    // 清理场景系统资源
    SceneLoader.destroy();
  },

  // ========== Scene场景核心API ==========

  /**
   * 初始化Canvas场景系统
   */
  async initCanvasScene() {
    console.log('🔄 初始化Canvas场景系统...');
    
    this.setData({ sceneLoading: true });
    
    try {
      // Step 1: 初始化SceneLoader
      const initResult = SceneLoader.init('storeCanvas');
      
      if (!initResult) {
        throw new Error('SceneLoader初始化失败');
      }
      
      console.log('✅ SceneLoader初始化成功');

      // Step 2: 预加载所有场景素材
      this.setData({ 
        sceneLoading: true,
        sceneError: null
      });
      
      const preloadResult = await SceneLoader.prelodAllScenes();
      
      if (!preloadResult) {
        throw new Error('场景素材预加载失败');
      }
      
      console.log('✅ 场景素材预加载完成');

      // Step 3: 渲染默认场景
      await SceneLoader.renderDefaultScene();
      
      console.log('✅ 默认场景渲染完成');

      // 更新场景统计信息
      this.updateSceneStatistics();
      
      this.setData({
        isSceneReady: true,
        sceneLoading: false,
        sceneError: null
      });
      
      console.log('🎉 Canvas场景系统初始化完成');
      
    } catch (error) {
      console.error('❌ Canvas场景系统初始化失败:', error);
      
      this.setData({
        sceneLoading: false,
        sceneError: error.message || '未知错误'
      });
      
      // 尝试降级渲染
      SceneLoader.renderFallback();
    }
  },

  /**
   * 切换到指定主题
   */  
  async switchTheme(themeName) {
    if (this.data.sceneLoading) {
      console.warn('⚠️ 场景正在加载中, 请稍后...');
      return;
    }
    
    // 验证主题
    const validThemes = ['川菜小馆', '粤式茶餐厅', '日式拉面馆', '烧烤店'];
    if (!validThemes.includes(themeName)) {
      console.error(`❌ 无效的主题: ${themeName}`);
      return;
    }
    
    console.log(`🔄 正在切换到主题: ${themeName}`);
    
    this.setData({ sceneLoading: true });
    
    try {
      const result = await SceneLoader.switchToTheme(themeName);
      
      if (result) {
        this.setData({
          currentTheme: themeName,
          sceneLoading: false,
          sceneError: null
        });
        
        // 更新统计信息
        this.updateSceneStatistics();
        
        console.log(`✅ 主题切换成功: ${themeName}`);
      } else {
        throw new Error('主题切换失败');
      }
      
    } catch (error) {
      console.error(`❌ 主题切换失败: ${error.message}`);
      
      this.setData({
        sceneLoading: false,
        sceneError: error.message
      });
    }
  },

  /**
   * 强制重绘当前场景
   */
  async refreshScene() {
    try {
      await SceneLoader.redrawScene();
      this.updateSceneStatistics();
      
      console.log('🔄 场景重绘完成');
    } catch (error) {
      console.error('❌ 场景重绘失败:', error);
    }
  },

  // ========== UI交互事件 ==========

  /**
   * 显示主题选择器
   */
  showThemeSelector() {
    this.setData({
      showThemeSelector: true
    });
  },

  /**
   * 主题选择器 - 主题切换回调
   */
  onThemeChange(e) {
    const newTheme = e.detail.theme;
    
    if (newTheme !== this.data.currentTheme) {
      this.switchTheme(newTheme);
    }
    
    this.onThemeSelectorClose();
  },

  /**
   * 主题选择器 - 关闭回调
   */
  onThemeSelectorClose() {
    this.setData({
      showThemeSelector: false
    });
  },

  /**
   * 主题选择器 - 预览回调
   */
  onThemePreview(e) {
    const theme = e.detail.theme;
    
    // 可以在这里做预览相关逻辑
    console.log(`👀 预览主题: ${theme}`);
  },

  // ========== 工具方法 ==========

  /**
   * 更新场景统计信息
   */
  updateSceneStatistics() {
    try {
      const stats = SceneLoader.getSceneStatistics();
      
      if (stats) {
        this.setData({
          sceneStats: {
            totalTables: stats.totalTables || 0,
            occupiedTables: stats.occupiedTables || 0,
            emptyTables: stats.emptyTables || 0,
            occupancyRate: stats.occupancyRate || '0%'
          }
        });
      }
    } catch (error) {
      console.error('❌ 获取场景统计失败:', error);
    }
  },

  /**
   * 重新初始化场景系统 (用于热重载)
   */
  async resetScene() {
    console.log('🔄 重新初始化场景系统');
    
    this.setData({
      isSceneReady: false,
      sceneLoading: true,
      showThemeSelector: false
    });
    
    try {
      // 重新初始化
      const result = await SceneLoader.reinitialize('storeCanvas');
      
      if (result) {
        // 重新渲染
        await SceneLoader.renderDefaultScene();
        this.updateSceneStatistics();
        
        this.setData({
          isSceneReady: true,
          sceneLoading: false,
          sceneError: null
        });
        
        console.log('✅ 场景系统重新初始化成功');
      } else {
        throw new Error('重新初始化失败');
      }
      
    } catch (error) {
      console.error('❌ 重新初始化失败:', error);
      
      this.setData({
        sceneLoading: false,
        sceneError: error.message
      });
    }
  },

  /**
   * 主题快速切换方法 (方便外部调用)
   */
  quickSwitchTheme(themeName) {
    // 可以在这里添加快捷切换逻辑
    if (themeName && themeName !== this.data.currentTheme) {
      this.switchTheme(themeName);
    }
  },

  // ========== 示例事件映射 ==========

  // 快速主题切换示例
  switchToSichuanRestaurant() {
    this.quickSwitchTheme('川菜小馆');
  },

  switchToCantoneseRestaurant() {
    this.quickSwitchTheme('粤式茶餐厅');
  },

  switchToJapaneseRamen() {
    this.quickSwitchTheme('日式拉面馆');
  },

  switchToBBQShop() {
    this.quickSwitchTheme('烧烤店');
  },

  // 生命周期快捷方法
  onSceneReady() {
    console.log('🎉 Scene准备完成, 可以在这里触发自定义逻辑');
    // 例如: 显示欢迎信息, 触发动画, 记录统计等
  },

  onSceneError() {
    const error = this.data.sceneError;
    console.log(`❌ Scene错误: ${error}`);
    // 可以在这里显示错误提示给用户
  }
});

/**
 * 示例: 如何在其他文件中调用此Page的方法
 * 
 * // 获取Page实例
 * const pages = getCurrentPages();
 * const storePage = pages[pages.length - 1];
 * 
 * // 调用主题切换
 * if (storePage && storePage.quickSwitchTheme) {
 *   storePage.quickSwitchTheme('日式拉面馆');
 * }
 *
 * // 刷新场景
 * if (storePage && storePage.refreshScene) {
 *   storePage.refreshScene();
 * }
 */

/**
 * 示例: 如何在监听到事件时自动更新场景
 * 
 * // 例如在Socket收到消息时切换主题
 * onSocketMessage(message) {
 *   if (message.type === 'SUGGEST_THEME') {
 *     this.quickSwitchTheme(message.theme);
 *   }
 * }
 */

/**
 * 示例: A/B测试不同主题
 * 
 * // 随机主题用于A/B测试
 * const themes = ['川菜小馆', '粤式茶餐厅', '日式拉面馆', '烧烤店'];
 * const randomTheme = themes[Math.floor(Math.random() * themes.length)];
 * this.quickSwitchTheme(randomTheme);
 */
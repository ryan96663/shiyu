// Canvas场景加载和应用模块
// 负责将Canvas场景系统适配到具体页面

class SceneLoader {
  constructor() {
    this.sceneManager = null;
    this.themeSwitcher = null;
    this.isInitialized = false;
    this.canvasContext = null;
    this.currentCanvasId = null;
  }

  // 初始化场景加载器（接收 Canvas 2D API 的 canvas node 和 ctx）
  init(canvas, ctx) {
    try {
      // 动态导入场景管理器
      this.sceneManager = require('./canvas-scene-manager');
      this.themeSwitcher = require('./theme-switcher');

      // 保存 canvas 和 ctx 引用（新 Canvas 2D API）
      this.canvas = canvas;
      this.canvasContext = ctx;

      // 初始化场景管理器（传入 canvas node 用于 createImage）
      this.sceneManager.init(canvas, ctx);

      this.isInitialized = true;
      console.log('✅ SceneLoader 初始化完成');

    } catch (error) {
      console.error('❌ SceneLoader 初始化失败:', error);
      this.isInitialized = false;
    }

    return this.isInitialized;
  }

  // 预加载所有需要的场景素材
  async prelodAllScenes() {
    if (!this.isInitialized || !this.sceneManager) {
      console.warn('⚠️ SceneLoader 未初始化');
      return false;
    }

    try {
      console.log('🔄 预加载场景素材...');
      const result = await this.sceneManager.preloadAssets();
      
      if (result) {
        console.log('✅ 场景素材预加载完成');
        return true;
      } else {
        console.error('❌ 场景素材预加载失败');
        return false;
      }
    } catch (error) {
      console.error('❌ 预加载过程中出错:', error);
      return false;
    }
  }

  // 渲染默认场景
  async renderDefaultScene() {
    if (!this.isInitialized || !this.sceneManager) {
      console.warn('⚠️ SceneLoader 未初始化');
      return false;
    }

    try {
      console.log('🎨 渲染默认场景...');
      
      // 设置默认主题
      this.sceneManager.setTheme('川菜小馆');
      
      // 绘制完整场景
      await this.sceneManager.drawCompleteScene();
      
      console.log('✅ 默认场景渲染完成');
      return true;
      
    } catch (error) {
      console.error('❌ 场景渲染失败:', error);
      return false;
    }
  }

  // 切换到指定主题场景
  async switchToTheme(themeName) {
    if (!this.isInitialized || !this.sceneManager) {
      console.warn('⚠️ SceneLoader 未初始化');
      return false;
    }

    try {
      console.log(`🔄 切换到主题: ${themeName}`);
      
      // 验证主题名称
      const validThemes = ['川菜小馆', '粤式茶餐厅', '日式拉面馆', '烧烤店'];
      if (!validThemes.includes(themeName)) {
        console.error(`❌ 无效的主题: ${themeName}`);
        return false;
      }
      
      // 使用主题切换器
      const switchResult = this.themeSwitcher.setTheme(themeName);
      if (!switchResult) {
        console.error('❌ 主题切换失败');
        return false;
      }
      
      // 更新场景管理器主题
      this.sceneManager.setTheme(themeName);
      
      // 重新绘制场景
      await this.sceneManager.drawCompleteScene();
      
      console.log(`✅ 成功切换到主题: ${themeName}`);
      return true;
      
    } catch (error) {
      console.error('❌ 主题切换失败:', error);
      return false;
    }
  }

  // 更新画布尺寸
  updateCanvasSize(width, height) {
    if (!this.isInitialized || !this.sceneManager) {
      console.warn('⚠️ SceneLoader 未初始化');
      return false;
    }

    try {
      // 更新场景管理器的Canvas信息
      this.sceneManager.canvas = {
        width: width,
        height: height
      };
      
      console.log(`📐 更新Canvas尺寸: ${width}x${height}`);
      return true;
      
    } catch (error) {
      console.error('❌ 更新画布尺寸失败:', error);
      return false;
    }
  }

  // 强制重绘场景
  async redrawScene() {
    if (!this.isInitialized || !this.sceneManager) {
      console.warn('⚠️ SceneLoader 未初始化');
      return false;
    }

    try {
      await this.sceneManager.drawCompleteScene();

      console.log('🔄 场景重绘完成');
      return true;
      
    } catch (error) {
      console.error('❌ 场景重绘失败:', error);
      return false;
    }
  }

  // 获取场景统计信息
  getSceneStatistics() {
    if (!this.isInitialized || !this.sceneManager) {
      console.warn('⚠️ SceneLoader 未初始化');
      return null;
    }

    try {
      const stats = this.sceneManager.getSceneStats();
      
      // 添加额外的统计信息
      stats.currentTheme = this.themeSwitcher.getCurrentTheme();
      stats.allThemes = this.themeSwitcher.getAvailableThemes();
      
      return stats;
      
    } catch (error) {
      console.error('❌ 获取场景统计失败:', error);
      return null;
    }
  }

  // 手动触发动画更新
  triggerAnimation() {
    if (!this.isInitialized || !this.canvasContext) {
      console.warn('⚠️ SceneLoader 未初始化');
      return false;
    }

    try {
      console.log('🎭 触发动画更新');
      
      // 重新绘制并触发Canvas动画
      this.sceneManager.drawCompleteScene()
        .then(() => {
          // 动画逻辑（新 Canvas 2D API 自动渲染，无需 draw()）
        })
        .catch(error => {
          console.error('动画更新失败:', error);
        });
      
      return true;
      
    } catch (error) {
      console.error('❌ 触发动画失败:', error);
      return false;
    }
  }

  // 清理资源
  destroy() {
    try {
      console.log('🧹 清理SceneLoader资源');
      
      // 清理场景管理器缓存
      if (this.sceneManager) {
        this.sceneManager.characters.clear();
        this.sceneManager.decorations.clear();
      }
      
      // 清理引用
      this.sceneManager = null;
      this.themeSwitcher = null;
      this.canvasContext = null;
      this.currentCanvasId = null;
      this.isInitialized = false;
      
      console.log('✅ SceneLoader资源清理完成');
      return true;
      
    } catch (error) {
      console.error('❌ 资源清理失败:', error);
      return false;
    }
  }

  // 重新初始化 (用于热重载)
  async reinitialize(canvas, ctx) {
    console.log('🔄 重新初始化SceneLoader');

    // 清理现有资源
    await this.destroy();

    // 重新初始化
    const result = this.init(canvas, ctx);

    if (result) {
      console.log('✅ SceneLoader重新初始化成功');
    } else {
      console.error('❌ SceneLoader重新初始化失败');
    }

    return result;
  }

  // 降级渲染 - 当遇到错误时提供基础体验
  renderFallback() {
    console.warn('⚠️ 使用降级渲染');

    if (!this.canvasContext) {
      console.error('❌ Canvas上下文不可用');
      return false;
    }

    try {
      const ctx = this.canvasContext;

      // 清空画布
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 绘制简单背景（新 Canvas 2D API 样式）
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // 绘制基本提示
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('场景加载中...', this.canvas.width / 2, this.canvas.height / 2);

      console.log('✅ 降级渲染完成');
      return true;

    } catch (error) {
      console.error('❌ 降级渲染失败:', error);
      return false;
    }
  }
}

// 导出SceneLoader实例
const sceneLoader = new SceneLoader();
module.exports = sceneLoader;
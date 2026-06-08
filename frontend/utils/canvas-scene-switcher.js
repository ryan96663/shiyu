// Canvas场景切换管理器
class CanvasSceneSwitcher {
  constructor() {
    this.currentScene = null;
    this.scenes = new Map();
    this.isTransitioning = false;
    this.transitionCallbacks = [];
    
    // 初始化内置场景模板
    this.initializeBuiltInScenes();
  }

  // 初始化内置场景模板
  initializeBuiltInScenes() {
    // 川菜小馆场景
    this.registerScene('川菜小馆', {
      id: '川菜小馆',
      name: '川菜小馆',
      type: 'restaurant', 
      category: '中式',
      description: '温馨家常菜氛围,普通小馆子感觉',
      
      canvas: {
        width: 1024,
        height: 768,
        scrollable: true,
        scrollDirection: 'vertical'
      },

      background: {
        type: 'gradient',
        colors: ['#8B4513', '#CD853F'], // 棕色渐变
        direction: 'vertical'
      },

      layout: {
        rows: 3,
        columns: 3,
        tableSpacing: {
          horizontal: 180,
          vertical: 150
        },
        margins: {
          left: 100,
          top: 200
        }
      },

      tables: {
        style: 'rectangular',
        width: 120,
        height: 80,
        color: '#8B4513',
        decoration: 'woodgrain'
      },

      characters: {
        enabled: true,
        maxPerTable: 3,
        minPerTable: 1,
        spawnRate: 0.75 // 75%的桌子有人
      },

      decorations: {
        ceilingLights: true,
        tableLamps: true,
        floorPattern: 'checkerboard'
      },

      atmosphere: {
        mood: 'cozy',
        lighting: 'warm',
        soundscape: 'background-chatter'
      }
    });

    // 粤式茶餐厅场景
    this.registerScene('粤式茶餐厅', {
      id: '粤式茶餐厅', 
      name: '粤式茶餐厅',
      type: 'restaurant',
      category: '港式',
      description: '现代与传统融合的茶餐厅氛围',

      canvas: {
        width: 1024,
        height: 768,
        scrollable: true,
        scrollDirection: 'both'
      },

      background: {
        type: 'gradient',
        colors: ['#2F4F4F', '#708090'], // 石板灰色渐变
        direction: 'vertical'
      },

      layout: {
        rows: 3,
        columns: 3,
        tableSpacing: {
          horizontal: 200,
          vertical: 160
        },
        margins: {
          left: 100,
          top: 180
        }
      },

      tables: {
        style: 'round',
        width: 110,
        height: 110,
        color: '#654321',
        decoration: 'marble'
      },

      characters: {
        enabled: true,
        maxPerTable: 4,
        minPerTable: 1,
        spawnRate: 0.85
      },

      decorations: {
        ceilingLights: true,
        aCUnits: true, // 空调
        floorPattern: 'checkerboard'
      },

      atmosphere: {
        mood: 'modern',
        lighting: 'bright',
        soundscape: 'bustling'
      }
    });

    // 日式拉面馆场景
    this.registerScene('日式拉面馆', {
      id: '日式拉面馆',
      name: '日式拉面馆',
      type: 'restaurant',
      category: '日式',
      description: '现代日式简约风格',

      canvas: {
        width: 1024,
        height: 768,
        scrollable: true,
        scrollDirection: 'horizontal'
      },

      background: {
        type: 'solid',
        color: '#2E2E2E' // 深灰色
      },

      layout: {
        rows: 2,
        columns: 4,
        tableSpacing: {
          horizontal: 150,
          vertical: 120
        },
        margins: {
          left: 150,
          top: 220
        }
      },

      tables: {
        style: 'bar-style',
        width: 80,
        height: 60,
        color: '#654321',
        decoration: 'bamboo'
      },

      characters: {
        enabled: true,
        maxPerTable: 2,
        minPerTable: 1,
        spawnRate: 0.8
      },

      decorations: {
        ceilingLights: true,
        neonSigns: true, // 霓虹灯
        floorPattern: 'plain'
      },

      atmosphere: {
        mood: 'minimalist',
        lighting: 'focused',
        soundscape: 'quiet'
      }
    });

    // 烧烤店场景
    this.registerScene('烧烤店', {
      id: '烧烤店',
      name: '烧烤店',
      type: 'restaurant',
      category: '夜餐',
      description: '夜晚烧烤热闹氛围',

      canvas: {
        width: 1200,
        height: 800,
        scrollable: true,
        scrollDirection: 'both'
      },

      background: {
        type: 'gradient',
        colors: ['#1C1C1C', '#4F4F4F'], // 夜晚深色调
        direction: 'vertical'
      },

      layout: {
        rows: 4,
        columns: 3,
        tableSpacing: {
          horizontal: 160,
          vertical: 140
        },
        margins: {
          left: 80,
          top: 160
        }
      },

      tables: {
        style: 'rectangular',
        width: 130,
        height: 90,
        color: '#2F2F2F',
        decoration: 'dark-wood'
      },

      characters: {
        enabled: true,
        maxPerTable: 5,
        minPerTable: 2,
        spawnRate: 0.9
      },

      decorations: {
        ceilingLights: true,
        bbqGrills: true, // 烧烤架
        smokeEffects: true,
        floorPattern: 'plain'
      },

      atmosphere: {
        mood: 'energetic',
        lighting: 'warm-orange',
        soundscape: 'lively-music'
      }
    });

    console.log('✅ 内置场景模板初始化完成');
  }

  // 注册新场景
  registerScene(id, sceneConfig) {
    if (!id || !sceneConfig) {
      console.error('❌ 场景ID和配置不能为空');
      return false;
    }

    // 验证场景配置
    if (!this.validateSceneConfig(sceneConfig)) {
      console.error(`❌ 场景配置验证失败: ${id}`);
      return false;
    }

    this.scenes.set(id, sceneConfig);
    console.log(`✅ 场景注册成功: ${id}`);
    return true;
  }

  // 验证场景配置
  validateSceneConfig(config) {
    const requiredFields = ['id', 'name', 'canvas', 'layout'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        console.warn(`⚠️ 场景配置缺少必要字段: ${field}`);
        return false;
      }
    }

    // 验证canvas配置
    if (!config.canvas.width || !config.canvas.height) {
      console.warn('⚠️ Canvas尺寸配置不完整');
      return false;
    }

    // 验证布局配置
    if (!config.layout.rows || !config.layout.columns) {
      console.warn('⚠️ 布局配置不完整');
      return false;
    }

    return true;
  }

  // 切换到指定场景
  async switchToScene(sceneId, options = {}) {
    if (this.isTransitioning) {
      console.warn('⚠️ 正在切换场景中，请稍后重试');
      return false;
    }

    const scene = this.scenes.get(sceneId);
    if (!scene) {
      console.error(`❌ 场景不存在: ${sceneId}`);
      return false;
    }

    this.isTransitioning = true;
    const startTime = Date.now();

    try {
      console.log(`🎬 正在切换到场景: ${sceneId}`);
      
      // 保存当前场景
      this.currentScene = scene;

      // 通知过渡监听器
      await this.notifyTransitionCallbacks('start', sceneId);

      // 执行场景过渡动画
      const duration = options.duration || 1000; // 默认1秒
      await this.animateSceneTransition(scene, duration);

      // 执行场景初始化
      await this.initializeScene(scene);

      // 通知过渡完成
      await this.notifyTransitionCallbacks('complete', sceneId);
      
      console.log(`✅ 场景切换完成: ${sceneId} (${Date.now() - startTime}ms)`);
      
      return true;
    } catch (error) {
      console.error(`❌ 场景切换失败: ${error.message}`);
      await this.notifyTransitionCallbacks('error', sceneId, error);
      return false;
    } finally {
      this.isTransitioning = false;
    }
  }

  // 动画场景过渡
  async animateSceneTransition(scene, duration = 1000) {
    // 这里可以实现过渡动画效果
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 这里可以添加淡入淡出效果
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  // 初始化场景
  async initializeScene(scene) {
    // 触发场景初始化事件
    if (scene.onInitialize) {
      await scene.onInitialize(scene);
    }
    
    // 重置Canvas尺寸
    if (scene.canvas) {
      this.updateCanvasDimensions(scene.canvas);
    }
    
    // 预加载场景素材
    await this.preloadSceneAssets(scene);
  }

  // 更新Canvas尺寸
  updateCanvasDimensions(canvasConfig) {
    // 通知Canvas组件更新尺寸
    wx.triggerEvent('canvas:resize', {
      width: canvasConfig.width,
      height: canvasConfig.height,
      scrollable: canvasConfig.scrollable,
      direction: canvasConfig.scrollDirection
    });
  }

  // 预加载场景素材
  async preloadSceneAssets(scene) {
    const assets = [];
    
    // 预加载人物素材
    if (scene.characters && scene.characters.enabled) {
      const characterAssets = this.getCharacterAssets(scene);
      assets.push(...characterAssets);
    }

    // 预加载装饰素材
    if (scene.decorations) {
      const decorationAssets = this.getDecorationAssets(scene);
      assets.push(...decorationAssets);
    }

    if (assets.length > 0) {
      try {
        await this.batchPreloadAssets(assets);
        console.log(`✅ 场景素材预加载完成: ${assets.length} 个`);
      } catch (error) {
        console.warn(`⚠️ 部分素材预加载失败: ${error.message}`);
      }
    }
  }

  // 获取人物素材列表
  getCharacterAssets(scene) {
    const assets = [];
    
    // 根据场景类型返回对应的人物素材
    const characterMap = {
      '川菜小馆': ['man-01', 'woman-01', 'woman-02'],
      '粤式茶餐厅': ['man-01', 'woman-01', 'woman-02'],
      '日式拉面馆': ['man-01', 'woman-01'],
      '烧烤店': ['man-01', 'woman-02', 'waiter']
    };
    
    const characters = characterMap[scene.id] || ['man-01', 'woman-01'];
    
    characters.forEach(char => {
      assets.push({
        type: 'character',
        id: char,
        path: `/images/sprites/characters/${char}.png`
      });
    });
    
    return assets;
  }

  // 获取装饰素材列表
  getDecorationAssets(scene) {
    const assets = [];
    
    // 基础装饰元素 (所有场景通用)
    const baseAssets = [
      { type: 'decoration', id: 'table', path: '/images/elements/table.png' },
      { type: 'decoration', id: 'chair', path: '/images/elements/chair.png' }
    ];
    
    assets.push(...baseAssets);
    
    // 特定场景的装饰元素
    if (scene.decorations?.bbqGrills && scene.id === '烧烤店') {
      assets.push({ type: 'decoration', id: 'bbq-grill', path: '/images/elements/bbq-grill.png' });
    }
    
    if (scene.decorations?.neonSigns && scene.id === '日式拉面馆') {
      assets.push({ type: 'decoration', id: 'neon-sign', path: '/images/elements/neon-sign.png' });
    }
    
    return assets;
  }

  // 批量预加载素材
  async batchPreloadAssets(assets) {
    const promises = assets.map(asset => this.preloadAsset(asset));
    return Promise.all(promises);
  }

  // 预加载单个素材
  preloadAsset(asset) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log(`📦 素材预加载: ${asset.id}`);
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`素材加载失败: ${asset.id}`));
      };
      img.src = asset.path;
    });
  }

  // 注册过渡监听器
  onTransition(callback) {
    if (typeof callback === 'function') {
      this.transitionCallbacks.push(callback);
    }
  }

  // 移除过渡监听器
  offTransition(callback) {
    const index = this.transitionCallbacks.indexOf(callback);
    if (index > -1) {
      this.transitionCallbacks.splice(index, 1);
    }
  }

  // 通知过渡监听器
  async notifyTransitionCallbacks(event, sceneId, data) {
    const promises = this.transitionCallbacks.map(callback => {
      try {
        return callback(event, sceneId, data);
      } catch (error) {
        console.error(`❌ 过渡回调执行失败: ${error.message}`);
        return Promise.resolve();
      }
    });
    
    await Promise.all(promises);
  }

  // 获取当前场景信息
  getCurrentScene() {
    return this.currentScene;
  }

  // 获取所有可用场景
  getAllScenes() {
    return Array.from(this.scenes.values());
  }

  // 根据分类获取场景
  getScenesByCategory(category) {
    return this.getAllScenes().filter(scene => scene.category === category);
  }

  // 获取场景预览信息  
  getScenePreview(sceneId) {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;

    return {
      id: scene.id,
      name: scene.name,
      description: scene.description,
      category: scene.category,
      thumbnail: scene.thumbnail || `/images/previews/${scene.id}.png`,
      layout: {
        dimensions: `${scene.layout.rows}x${scene.layout.columns}`,
        tableCount: scene.layout.rows * scene.layout.columns
      },
      features: {
        scrollable: scene.canvas?.scrollable || false,
        characters: scene.characters?.enabled || false,
        decorations: Object.keys(scene.decorations || {}).length
      }
    };
  }
}

// 导出单例实例
const sceneSwitcher = new CanvasSceneSwitcher();
module.exports = sceneSwitcher;
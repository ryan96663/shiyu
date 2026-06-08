// 场景生成器工具类
class SceneGenerator {
  constructor() {
    this.basePrompt = "stardew valley style pixel art restaurant interior, 8bit retro, detailed wooden tables and chairs";
    this.scenes = {
      'day': {
        atmosphere: "cozy warm lighting, bright atmosphere, sunny day",
        palette: "warm yellow lighting, natural sunlight",
        details: "customers dining, fresh vegetables on display",
        size: "1024x512"
      },
      'night': {
        atmosphere: "romantic evening ambiance, intimate mood",
        palette: "warm orange lighting, soft shadows, candle light effect",
        details: "evening dining atmosphere, soft lighting",
        size: "1024x512"
      },
      'cafe': {
        atmosphere: "cozy coffee shop atmosphere, relaxed mood",
        palette: "warm brown coffee tones, cream color accents",
        details: "coffee machines, pastries display, reading customers",
        size: "1024x512"
      },
      'restaurant': {
        atmosphere: "busy restaurant dining, lively atmosphere",
        palette: "warm restaurant lighting, golden hour tones",
        details: "busy dining hall, multiple tables, chef area",
        size: "1024x512"
      },
      'dessert': {
        atmosphere: "sweet dessert shop, candy colors",
        palette: "pink pastel colors, sweet candy tones, bright colors",
        details: "dessert counter, colorful cakes, sweet treats",
        size: "1024x512"
      }
    };
    
    this.cache = new Map();
  }

  // 生成完整的prompt
  generatePrompt(sceneType) {
    const scene = this.scenes[sceneType];
    if (!scene) {
      console.warn(`未知场景类型: ${sceneType}, 使用默认场景`);
      return this.generatePrompt('day');
    }

    const prompt = `${this.basePrompt}, ${scene.atmosphere}, ${scene.palette}, ${scene.details}, pixel perfect 16px tiles, game screenshot style, ${scene.size} PNG, no text, no logo, no watermark`;
    
    return {
      prompt: prompt,
      negativePrompt: "realistic, photo, 3D, smooth, blur, text, logo, chinese, watermark, anime, manga",
      size: scene.size
    };
  }

  // 获取缓存的URL
  getCachedScene(sceneType) {
    return this.cache.get(sceneType);
  }

  // 设置缓存
  setCachedScene(sceneType, imageUrl) {
    this.cache.set(sceneType, imageUrl);
    
    // 同时缓存到本地存储
    wx.setStorageSync(`scene_cache_${sceneType}`, {
      url: imageUrl,
      timestamp: Date.now()
    });
  }

  // 从本地存储加载缓存
  loadCachedScenes() {
    const sceneTypes = Object.keys(this.scenes);
    sceneTypes.forEach(sceneType => {
      try {
        const cached = wx.getStorageSync(`scene_cache_${sceneType}`);
        if (cached && cached.url) {
          // 检查缓存是否过期（24小时）
          const isExpired = Date.now() - cached.timestamp > 24 * 60 * 60 * 1000;
          if (!isExpired) {
            this.cache.set(sceneType, cached.url);
          }
        }
      } catch (error) {
        console.warn(`加载场景缓存失败: ${sceneType}`, error);
      }
    });
  }

  // 使用Clipdrop生成场景（客户端实现）
  async generateWithClipdrop(sceneType) {
    const { prompt, negativePrompt, size } = this.generatePrompt(sceneType);
    
    try {
      // 检查缓存
      const cached = this.getCachedScene(sceneType);
      if (cached) {
        console.log(`使用缓存场景: ${sceneType}`);
        return cached;
      }

      // Clipdrop API调用（使用Web端API）
      const response = await this.callClipdropAPI(prompt, negativePrompt, size);
      
      if (response.success && response.imageUrl) {
        // 缓存生成的图片
        this.setCachedScene(sceneType, response.imageUrl);
        return response.imageUrl;
      } else {
        throw new Error(`图片生成失败: ${response.error || '未知错误'}`);
      }
    } catch (error) {
      console.error(`场景生成失败: ${sceneType}`, error);
      
      // 降级处理：使用默认场景
      if (sceneType !== 'day') {
        console.log('降级到默认白天场景');
        return this.getCachedScene('day') || '/images/default-day.png';
      }
      
      throw error;
    }
  }

  // Clipdrop API调用
  async callClipdropAPI(prompt, negativePrompt, size) {
    try {
      // 注意：实际项目中需要通过后端代理调用Clipdrop API
      // 这里简化为直接调用示例
      
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://api.clipdrop.co/api/text-to-image/v1/generate', 
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'x-api-key': 'YOUR_CLIPDROP_API_KEY' // 实际项目中从后端获取
          },
          data: {
            prompt: prompt,
            negative_prompt: negativePrompt,
            width: parseInt(size.split('x')[0]),
            height: parseInt(size.split('x')[1]),
            format: 'png'
          },
          success: (res) => {
            if (res.statusCode === 200 && res.data.image) {
              resolve({
                success: true,
                imageUrl: res.data.image
              });
            } else {
              resolve({
                success: false,
                error: res.data.error || 'API调用失败'
              });
            }
          },
          fail: (err) => {
            resolve({
              success: false,
              error: err.errMsg || '网络请求失败'
            });
          }
        });
      });

      return response;
    } catch (error) {
      console.error('Clipdrop API调用失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 降级：使用预设图片
  getFallbackImage(sceneType) {
    const fallbackImages = {
      'day': '/images/scenes/day-restaurant.png',
      'night': '/images/scenes/night-restaurant.png',
      'cafe': '/images/scenes/cafe-restaurant.png',
      'restaurant': '/images/scenes/busy-restaurant.png',
      'dessert': '/images/scenes/dessert-shop.png'
    };
    
    return fallbackImages[sceneType] || fallbackImages['day'];
  }

  // 获取所有支持场景类型
  getSupportedScenes() {
    return Object.keys(this.scenes);
  }

  // 预加载所有场景
  async preloadAllScenes() {
    const sceneTypes = this.getSupportedScenes();
    const promises = sceneTypes.map(sceneType => 
      this.generateWithClipdrop(sceneType).catch(error => {
        console.warn(`预加载场景失败: ${sceneType}`, error);
        return this.getFallbackImage(sceneType);
      })
    );

    try {
      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`场景预加载完成: ${successCount}/${sceneTypes.length} 成功`);
      return successCount;
    } catch (error) {
      console.error('场景预加载失败:', error);
      return 0;
    }
  }
}

// 导出单例实例
const sceneGenerator = new SceneGenerator();

// 初始化时加载缓存
sceneGenerator.loadCachedScenes();

module.exports = sceneGenerator;
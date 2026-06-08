/**
 * Theme Manager - 主题管理器
 * 负责餐厅画布的4种主题切换和环境效果控制
 * 符合设计方案要求的轻量主题切换系统
 */

class RestaurantThemeManager {
  constructor() {
    
    // 主题定义 - 符合设计方案规范
    this.themes = {
      
      // 白天晴天
      day_sunny: {
        name: '白天晴天',
        description: '明亮温暖的白天场景',
        
        // 天空颜色
        skyGradient: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 100%)',
        
        // 环境设置
        brightness: 1.0,
        saturation: 1.0,
        contrast: 1.0,
        
        // 时间范围
        timeRange: { start: 6, end: 18 },
        
        // CSS 类名
        cssClass: 'theme-day_sunny',
        
        // 天气关联
        weather: 'sunny',
        showWeatherEffect: false,
        
        // 灯光设置
        ceilingLights: {
          enabled: false,
          intensity: 0
        },
        
        // 阴影强度
        shadowIntensity: 0.1
      },
      
      // 白天雨天
      day_rainy: {
        name: '白天雨天',
        description: '阴天雨天气氛',
        
        // 天空颜色 - 阴灰色
        skyGradient: 'linear-gradient(180deg, #708090 0%, #95A5A6 100%)',
        
        // 环境设置 - 降低对比度和饱和度
        brightness: 0.85,
        saturation: 0.7,
        contrast: 0.9,
        
        // 时间范围
        timeRange: { start: 6, end: 18 },
        
        // CSS 类名
        cssClass: 'theme-day_rainy',
        
        // 天气关联
        weather: 'rainy',
        showWeatherEffect: true,
        weatherEffect: 'rain',
        
        // 灯光设置
        ceilingLights: {
          enabled: false,
          intensity: 0
        },
        
        // 阴影强度
        shadowIntensity: 0.15
      },
      
      // 夜间晴天
      night_sunny: {
        name: '夜间晴天',
        description: '晴朗夜晚氛围',
        
        // 天空颜色 - 夜空蓝
        skyGradient: 'linear-gradient(180deg, #191970 0%, #2F2F6F 100%)',
        
        // 环境设置 - 降低亮度
        brightness: 0.7,
        saturation: 1.0,
        contrast: 1.1,
        
        // 时间范围
        timeRange: { start: 18, end: 6 },
        
        // CSS 类名
        cssClass: 'theme-night_sunny',
        
        // 天气关联
        weather: 'sunny',
        showWeatherEffect: false,
        
        // 灯光设置 - 启用夜间灯光
        ceilingLights: {
          enabled: true,
          intensity: 1.0,
          color: '#FFD700',
          flicker: true
        },
        
        // 阴影强度
        shadowIntensity: 0.25
      },
      
      // 夜间雨天
      night_rainy: {
        name: '夜间雨天',
        description: '雨夜氛围',
        
        // 天空颜色 - 深夜暗色
        skyGradient: 'linear-gradient(180deg, #2F2F6F 0%, #1A1A40 100%)',
        
        // 环境设置 - 最低亮度
        brightness: 0.6,
        saturation: 0.6,
        contrast: 1.2,
        
        // 时间范围
        timeRange: { start: 18, end: 6 },
        
        // CSS 类名
        cssClass: 'theme-night_rainy',
        
        // 天气关联
        weather: 'rainy',
        showWeatherEffect: true,
        weatherEffect: 'rain',
        
        // 灯光设置 - 夜间+雨天增强灯光
        ceilingLights: {
          enabled: true,
          intensity: 1.2,
          color: '#FFD700',
          flicker: true
        },
        
        // 阴影强度
        shadowIntensity: 0.3
      }
    };
    
    // 餐厅类型色彩映射
    this.restaurantTypes = {
      sichuan: {
        name: '川菜馆',
        color: '#D2B48C',
        accent: '#CD853F',
        atmosphere: 'warm'
      },
      cantonese: {
        name: '粤式茶餐厅',
        color: '#E6E6FA',
        accent: '#DDA0DD',
        atmosphere: 'elegant'
      },
      japanese: {
        name: '日式拉面馆',
        color: '#5D4E37',
        accent: '#8B7355',
        atmosphere: 'minimalist'
      },
      bbq: {
        name: '烧烤店',
        color: '#2F2F2F',
        accent: '#8B4513',
        atmosphere: 'rustic'
      }
    };
    
    // 当前状态
    this.currentTheme = null;
    this.currentRestaurantType = 'sichuan';
    this.listeners = new Set();
  }
  
  /**
   * 解析主题 - 核心方法
   * @param {Object} options 环境参数
   * @param {number} options.hour 当前小时(24小时制)
   * @param {string} options.weather 天气状态
   * @param {string} options.restaurantType 餐厅类型
   * @returns {Object} 主题配置
   */
  resolveTheme({ hour, weather = 'sunny', restaurantType = 'sichuan' }) {
    
    // 参数验证
    if (!hour && hour !== 0) {
      console.warn('🚨 ThemeManager: 无效的时间参数，使用当前时间');
      hour = new Date().getHours();
    }
    
    // 标准化天气参数
    const normalizedWeather = this.normalizeWeather(weather);
    
    // 时间判断 (6:00-18:00为白天)
    const isDay = hour >= 6 && hour < 18;
    const timeKey = isDay ? 'day' : 'night';
    
    // 天气判断 
    const weatherKey = normalizedWeather === 'rainy' ? 'rainy' : 'sunny';
    
    // 生成主题键
    const themeKey = `${timeKey}_${weatherKey}`;
    
    // 获取主题配置
    const themeConfig = this.themes[themeKey];
    if (!themeConfig) {
      console.warn('🚨 ThemeManager: 主题不存在，使用默认主题', themeKey);
      return this.themes.day_sunny;
    }
    
    // 获取餐厅类型配置
    const typeConfig = this.restaurantTypes[restaurantType] || this.restaurantTypes.sichuan;
    
    // 完整主题信息
    const fullTheme = {
      key: themeKey,
      name: themeConfig.name,
      theme: themeConfig,
      restaurantType: typeConfig,
      isDay,
      isNight: !isDay,
      isSunny: normalizedWeather === 'sunny',
      isRainy: normalizedWeather === 'rainy',
      timestamp: Date.now()
    };
    
    // 更新当前状态
    this.currentTheme = fullTheme;
    this.currentRestaurantType = restaurantType;
    
    // 通知监听器
    this.notifyListeners(fullTheme);
    
    console.log('🎨 ThemeManager: 主题切换至', themeKey, fullTheme);
    
    return fullTheme;
  }
  
  /**
   * 标准化天气参数
   */
  normalizeWeather(weather) {
    if (!weather) return 'sunny';
    
    const weatherMap = {
      'sunny': 'sunny',
      'clear': 'sunny',
      'fair': 'sunny',
      'rainy': 'rainy', 
      'rain': 'rainy',
      'raining': 'rainy',
      'drizzle': 'rainy',
      'shower': 'rainy'
    };
    
    return weatherMap[weather.toLowerCase()] || 'sunny';
  }
  
  /**
   * 获取所有可用主题
   */
  getAvailableThemes() {
    return Object.keys(this.themes).map(key => ({
      key,
      ...this.themes[key]
    }));
  }
  
  /**
   * 获取所有餐厅类型
   */
  getAvailableRestaurantTypes() {
    return Object.keys(this.restaurantTypes).map(key => ({
      key,
      ...this.restaurantTypes[key]
    }));
  }
  
  /**
   * 获取当前主题信息
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  /**
   * 生成主题的 CSS 样式
   */
  generateThemeStyles(themeKey, restaurantType = 'sichuan') {
    const theme = this.themes[themeKey];
    const restaurant = this.restaurantTypes[restaurantType];
    
    if (!theme || !restaurant) {
      console.warn('ThemeManager: 无效的主题参数', { themeKey, restaurantType });
      return '';
    }
    
    // 生成CSS变量
    const cssVars = [
      `--theme-brightness: ${theme.brightness}`,
      `--theme-saturation: ${theme.saturation}`,
      `--theme-contrast: ${theme.contrast}`,
      `--theme-shadow-intensity: ${theme.shadowIntensity}`,
      `--floor-color: ${restaurant.color}`,
      `--accent-color: ${restaurant.accent}`
    ].join('; ');
    
    // 生成CSS类
    const css = `
      .${theme.cssClass} {
        filter: brightness(var(--theme-brightness)) saturate(var(--theme-saturation)) contrast(var(--theme-contrast));
      }
      .${theme.cssClass} .window-area {
        background: ${theme.skyGradient};
      }
      .${theme.cssClass} .floor-base {
        background-color: var(--floor-color);
      }
    `;
    
    return { css, cssVars };
  }
  
  /**
   * 添加主题变化监听器
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /**
   * 通知所有监听器
   */
  notifyListeners(themeData) {
    this.listeners.forEach(callback => {
      try {
        callback(themeData);
      } catch (error) {
        console.error('ThemeManager: 监听器执行错误', error);
      }
    });
  }
  
  /**
   * 生成预览主题集
   */
  getPreviewThemes() {
    return [
      {
        name: '🌞 白天晴天',
        key: 'day_sunny',
        preview: '明亮温暖'
      },
      {
        name: '🌧️ 白天雨天', 
        key: 'day_rainy',
        preview: '阴天小雨'
      },
      {
        name: '🌙 夜间晴天',
        key: 'night_sunny',
        preview: '月夜星稀'
      },
      {
        name: '🌧️🌙 夜间雨天',
        key: 'night_rainy',
        preview: '雨夜温馨'
      }
    ];
  }
  
  /**
   * 生成环境效果配置
   */
  getEnvironmentEffects(themeKey) {
    const theme = this.themes[themeKey];
    if (!theme) return null;
    
    return {
      weather: {
        enabled: theme.showWeatherEffect,
        type: theme.weatherEffect,
        intensity: theme.brightness
      },
      lighting: theme.ceilingLights,
      shadows: {
        intensity: theme.shadowIntensity
      }
    };
  }
  
  /**
   * 导出主题配置
   */
  exportConfig() {
    return {
      themes: this.themes,
      restaurantTypes: this.restaurantTypes,
      currentTheme: this.currentTheme,
      currentRestaurantType: this.currentRestaurantType,
      timestamp: Date.now()
    };
  }
  
  /**
   * 导入主题配置
   */
  importConfig(config) {
    if (!config || !config.themes) {
      console.warn('ThemeManager: 无效的配置数据');
      return false;
    }
    
    try {
      Object.assign(this.themes, config.themes);
      if (config.restaurantTypes) {
        Object.assign(this.restaurantTypes, config.restaurantTypes);
      }
      
      console.log('ThemeManager: 配置导入成功');
      return true;
    } catch (error) {
      console.error('ThemeManager: 配置导入失败', error);
      return false;
    }
  }
  
  /**
   * 更新主题参数
   */
  updateTheme(themeKey, updates) {
    if (!this.themes[themeKey]) {
      console.warn('ThemeManager: 主题不存在', themeKey);
      return false;
    }
    
    try {
      Object.assign(this.themes[themeKey], updates);
      console.log('ThemeManager: 主题更新成功', themeKey, updates);
      return true;
    } catch (error) {
      console.error('ThemeManager: 主题更新失败', error);
      return false;
    }
  }
  
  /**
   * 创建自定义主题
   */
  createCustomTheme(key, config) {
    if (this.themes[key]) {
      console.warn('ThemeManager: 主题已存在将覆盖', key);
    }
    
    // 验证配置结构
    const validConfig = this.validateThemeConfig(config);
    if (!validConfig) {
      console.error('ThemeManager: 无效的主题配置');
      return false;
    }
    
    this.themes[key] = {
      ...validConfig,
      name: config.name || key,
      cssClass: `theme-${key}`
    };
    
    console.log('ThemeManager: 自定义主题创建成功', key);
    return true;
  }
  
  /**
   * 验证主题配置
   */
  validateThemeConfig(config) {
    const required = ['skyGradient', 'brightness'];
    const missing = required.filter(key => !(key in config));
    
    if (missing.length > 0) {
      console.error('ThemeManager: 主题配置缺少必要字段', missing);
      return false;
    }
    
    // 设置默认值
    return {
      brightness: config.brightness || 1.0,
      saturation: config.saturation || 1.0, 
      contrast: config.contrast || 1.0,
      skyGradient: config.skyGradient,
      showWeatherEffect: config.showWeatherEffect || false,
      weatherEffect: config.weatherEffect || 'none',
      ceilingLights: {
        enabled: config.ceilingLights?.enabled || false,
        intensity: config.ceilingLights?.intensity || 0
      },
      shadowIntensity: config.shadowIntensity || 0.1
    };
  }
  
  /**
   * 获取调试信息
   */
  getDebugInfo() {
    return {
      themeCount: Object.keys(this.themes).length,
      restaurantTypeCount: Object.keys(this.restaurantTypes).length,
      currentTheme: this.currentTheme?.key,
      listenerCount: this.listeners.size,
      themes: this.getAvailableThemes().map(t => ({
        key: t.key,
        name: t.name,
        brightness: t.brightness
      }))
    };
  }
}

// 导出单例实例
const themeManager = new RestaurantThemeManager();
module.exports = {
  themeManager,
  RestaurantThemeManager
};

/**
 * 使用示例:
 * 
 * const { themeManager } = require('./theme-manager');
 * 
 * // 解析主题
 * const theme = themeManager.resolveTheme({
 *   hour: 14,           // 下午2点
 *   weather: 'rainy',   // 雨天
 *   restaurantType: 'sichuan' // 川菜馆
 * });
 * 
 * // 监听主题变化
 * const removeListener = themeManager.addListener((themeData) => {
 *   console.log('主题切换:', themeData.key);
 * });
 * 
 * // 获取预览主题
 * const previews = themeManager.getPreviewThemes();
 * 
 * // 生成CSS样式
 * const { css, cssVars } = themeManager.generateThemeStyles('day_sunny', 'sichuan');
 */
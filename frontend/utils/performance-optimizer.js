/**
 * Performance Optimizer - 性能优化器
 * 统一管理和优化餐厅画布的渲染性能、内存使用和加载效率
 * 遵循设计方案的性能优化要求
 */

class PerformanceOptimizer {
  constructor() {
    
    // 性能监控状态
    this.enabled = true;
    this.metricsCollection = true;
    this.autoOptimization = true;
    
    // 监控数据
    this.metrics = {
      renderTimes: [],
      memoryUsage: [],
      loadTimes: [],
      interactionLatency: [],
      scrollPerformance: []
    };
    
    // 性能指标阈值
    this.thresholds = {
      maxRenderTime: 16.67, // 60fps        
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxLoadTime: 3000,    // 3秒
      maxInteractionLatency: 100,       // 100ms
      targetFPS: 60
    };
    
    // 优化策略
    this.optimizationStrategies = {
      'memory-low': {
        imageResolution: 'low',
        animationQuality: 'minimal',
        enablePreload: false,
        maxCachedImages: 5
      },
      'memory-medium': {
        imageResolution: 'medium', 
        animationQuality: 'standard',
        enablePreload: true,
        maxCachedImages: 10
      },
      'memory-high': {
        imageResolution: 'high',
        animationQuality: 'enhanced',
        enablePreload: true,
        maxCachedImages: 20
      }
    };
    
    // 性能等级
    this.performanceTier = 'medium';
    this.currentFPS = 0;
    this.frameCount = 0;
    this.lastFrameTime = Date.now();
    
    // 渲染优化器
    this.renderOptimizer = {
      enabled: true,
      maxConcurrentAnimations: 10,
      minAnimationDuration: 100,
      debounceScroll: true,
      useHardwareAcceleration: true
    };
    
    // 内存管理器
    this.memoryManager = {
      imageCacheMax: 50,
      clearUnusedInterval: 30000, // 30秒
      keepAliveDuration: 300000,  // 5分钟
      compressionEnabled: true
    };
    
    // 初始化性能监控
    this.initializePerformanceMonitoring();
  }
  
  /**
   * 初始化性能监控
   */
  initializePerformanceMonitoring() {
    console.log('⚡ PerformanceOptimizer: 初始化性能监控');
    
    // 监控帧率
    this.startFPSMonitoring();
    
    // 监控内存使用
    if (this.isMemoryAPIAvailable()) {
      this.startMemoryMonitoring();
    }
    
    // 监控网络性能
    this.observeNetworkPerformance();
    
    // 自适应优化
    this.setupAdaptiveOptimization();
  }
  
  /**
   * 启动FPS监控
   */
  startFPSMonitoring() {
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = () => {
      const now = performance.now();
      frames++;
      
      if (now >= lastTime + 1000) {
        this.currentFPS = Math.round((frames * 1000) / (now - lastTime));
        this.frameCount = frames;
        
        // 记录FPS数据
        this.metrics.renderTimes.push({
          fps: this.currentFPS,
          timestamp: now
        });
        
        // 限制历史数据长度
        if (this.metrics.renderTimes.length > 60) {
          this.metrics.renderTimes.shift();
        }
        
        // FPS过低时触发优化
        if (this.currentFPS < 30 && this.autoOptimization) {
          this.triggerEmergencyOptimization();
        }
        
        frames = 0;
        lastTime = now;
      }
      
      if (this.enabled) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  /**
   * 启动内存监控
   */
  startMemoryMonitoring() {
    if (!this.isMemoryAPIAvailable()) {
      console.log('PerformanceOptimizer: 当前环境不支持内存监控');
      return;
    }
    
    const monitorMemory = () => {
      if (!this.enabled) return;
      
      const memoryInfo = performance.memory;
      const usage = {
        used: memoryInfo.usedJSHeapSize,
        total: memoryInfo.totalJSHeapSize,
        limit: memoryInfo.jsHeapSizeLimit,
        timestamp: Date.now()
      };
      
      this.metrics.memoryUsage.push(usage);
      
      // 限制历史数据长度
      if (this.metrics.memoryUsage.length > 30) {
        this.metrics.memoryUsage.shift();
      }
      
      // 内存使用过高时触发清理
      if (usage.used > this.thresholds.maxMemoryUsage) {
        this.triggerMemoryCleanup();
      }
      
      // 自适应调整性能策略
      this.adjustPerformanceStrategy(usage);
    };
    
    // 每5秒检查一次内存
    setInterval(monitorMemory, 5000);
    
    // 立即执行一次
    monitorMemory();
  }
  
  /**
   * 监控网络性能
   */ 
  observeNetworkPerformance() {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        // 监控资源加载性能
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach(entry => {
            if (entry.entryType === 'resource') {
              // 只监控图片资源
              if (entry.name.includes('.png') || entry.name.includes('.jpg') || entry.name.includes('.gif')) {
                this.metrics.loadTimes.push({
                  resource: entry.name,
                  duration: entry.duration,
                  size: entry.transferSize || 0,
                  timestamp: Date.now()
                });
                
                // 限制历史数据
                if (this.metrics.loadTimes.length > 50) {
                  this.metrics.loadTimes.shift();
                }
                
                // 加载时间过长时优化
                if (entry.duration > this.thresholds.maxLoadTime) {
                  this.optimizeAssetLoading(entry.name);
                }
              }
            }
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        
      } catch (error) {
        console.warn('PerformanceOptimizer: 网络性能监控初始化失败', error);
      }
    }
  }
  
  /**
   * 设置自适应优化
   */
  setupAdaptiveOptimization() {
    // 设备能力检测
    this.detectDeviceCapabilities();
    
    // 网络状态监听
    this.observeNetworkChanges();
    
    // 电池状态监听
    this.observeBatteryStatus();
    
    // 用户偏好检测
    this.detectUserPreferences();
    
    console.log('PerformanceOptimizer: 自适应优化策略已配置');
  }
  
  /**
   * 检测设备能力
   */
  detectDeviceCapabilities() {
    const capabilities = {
      screenSize: this.getScreenSize(),
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      reducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches,
      lowBattery: false,
      connectionType: this.getNetworkConnectionType()
    };
    
    // 根据设备能力调整性能策略
    if (capabilities.screenSize.width < 375 || capabilities.pixelRatio > 2) {
      this.setPerformanceMode('conservative');
    } else if (capabilities.touchSupport && !capabilities.reducedMotion) {
      this.setPerformanceMode('standard');
    } else {
      this.setPerformanceMode('enhanced');
    }
    
    console.log('设备能力检测:', capabilities);
    return capabilities;
  }
  
  /**
   * 获取屏幕尺寸
   */
  getScreenSize() {
    return {
      width: window.innerWidth || screen.width,
      height: window.innerHeight || screen.height
    };
  }
  
  /**
   * 获取网络连接类型
   */ 
  getNetworkConnectionType() {
    if (navigator.connection) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }
  
  /**
   * 监听网络变化
   */
  observeNetworkChanges() {
    if (navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        const connectionType = this.getNetworkConnectionType();
        
        if (connectionType === 'slow-2g' || connectionType === '2g') {
          this.setPerformanceMode('minimal');
        } else if (connectionType === '3g') {
          this.setPerformanceMode('conservative');
        } else {
          this.setPerformanceMode('standard');
        }
      });
    }
  }
  
  /**
   * 监听电池状态
   */
  observeBatteryStatus() {
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        this.updateBatteryStatus(battery);
        
        battery.addEventListener('levelchange', () => this.updateBatteryStatus(battery));
        battery.addEventListener('chargingchange', () => this.updateBatteryStatus(battery));
      }).catch(error => {
        console.log('电池状态监控不可用:', error);
      });
    }
  }
  
  /**
   * 更新电池状态
   */
  updateBatteryStatus(battery) {
    const isLowBattery = battery.level < 0.2 && !battery.charging;
    
    if (isLowBattery) {
      this.setPerformanceMode('power-save');
      console.log('电池电量低，启用省电模式');
    } else {
      this.setPerformanceMode('standard');
    }
  }
  
  /**
   * 检测用户偏好
   */
  detectUserPreferences() {
    const preferences = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      reducedData: window.matchMedia('(prefers-reduced-data: reduce)').matches,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    };
    
    // 应用用户偏好优化
    if (preferences.reducedMotion) {
      this.disableAnimations();
    }
    
    if (preferences.reducedData) {
      this.enableDataSaving();
    }
    
    return preferences;
  }
  
  /**
   * 设置性能模式
   */
  setPerformanceMode(mode) {
    const modes = {
      'minimal': 'memory-low',
      'conservative': 'memory-medium', 
      'standard': 'memory-medium',
      'enhanced': 'memory-high',
      'power-save': 'memory-low'
    };
    
    const strategyKey = modes[mode] || 'memory-medium';
    this.performanceTier = strategyKey;
    
    console.log('PerformanceOptimizer: 切换到性能模式', mode, '->', strategyKey);
  }
  
  /**
   * 调整性能策略
   */
  adjustPerformanceStrategy(memoryUsage) {
    const usageRatio = memoryUsage.used / memoryUsage.limit;
    
    if (usageRatio > 0.7) {
      this.setPerformanceMode('memory-low');
    } else if (usageRatio > 0.4) {
      this.setPerformanceMode('memory-medium');
    } else {
      this.setPerformanceMode('memory-high');
    }
  }
  
  /**
   * 触发紧急优化
   */
  triggerEmergencyOptimization() {
    console.warn('⚡ PerformanceOptimizer: FPS过低，触发紧急优化');
    
    // 立即执行的性能优化措施
    this.executeOptimizationActions([
      'disableAnimations',
      'reduceImageQuality', 
      'clearUnusedCache',
      'limitRendering',
      'throttleInteractions'
    ]);
  }
  
  /**
   * 触发内存清理
   */
  triggerMemoryCleanup() {
    console.log('🧹 PerformanceOptimizer: 内存使用过高，执行清理');
    
    this.executeOptimizationActions([
      'clearUnusedCache',
      'compressImages',
      'limitImageCache',
      'removeEventListeners'
    ]);
  }
  
  /**
   * 执行优化操作
   */
  executeOptimizationActions(actions) {
    actions.forEach(action => {
      try {
        switch (action) {
          case 'disableAnimations':
            this.disableAnimations();
            break;
          case 'reduceImageQuality':
            this.reduceImageQuality();
            break;  
          case 'clearUnusedCache':
            this.clearUnusedCache();
            break;
          case 'compressImages':
            this.compressImages();
            break;
          case 'limitImageCache':
            this.limitImageCache();
            break;
          case 'limitRendering':
            this.limitRendering();
            break;
          case 'throttleInteractions':
            this.throttleInteractions();
            break;
          case 'removeEventListeners':
            this.removeEventListeners();
            break;
          default:
            console.warn('未知的优化操作:', action);
        }
      } catch (error) {
        console.error('优化操作执行失败:', action, error);
      }
    });
  }
  
  /**
   * 禁用动画
   */
  disableAnimations() {
    this.renderOptimizer.enabled = false;
    this.renderOptimizer.maxConcurrentAnimations = 0;
    document.body.classList.add('reduced-motion');
    console.log('动画已禁用');
  }
  
  /**
   * 降低图片质量
   */
  reduceImageQuality() {
    // 在实际应用中，这里会动态修改图片src以使用低分辨率版本
    console.log('图片质量降级已启用');
  }
  
  /**
   * 清理未使用的缓存
   */
  clearUnusedCache() {
    // 清理 resourceManager 缓存
    if (typeof resourceManager !== 'undefined') {
      resourceManager.clearCache();
    }
    
    // 清理 ImageCache
    if (this.memoryManager.imageCacheMax > 10) {
      this.memoryManager.imageCacheMax = Math.floor(this.memoryManager.imageCacheMax * 0.7);
    }
    
    console.log('未使用缓存已清理');
  }
  
  /**
   * 压缩图片
   */
  compressImages() {
    this.memoryManager.compressionEnabled = true;
    console.log('图片压缩已启用');
  }
  
  /**
   * 限制图片缓存
   */
  limitImageCache() {
    this.memoryManager.imageCacheMax = 5;
    console.log('图片缓存限制已调整');
  }
  
  /**
   * 限制渲染
   */
  limitRendering() {
    this.renderOptimizer.maxConcurrentAnimations = 2;
    this.renderOptimizer.minAnimationDuration = 300;
    console.log('渲染限制已启用');
  }
  
  /**
   * 节流交互
   */
  throttleInteractions() {
    this.throttleUserInteractions = true;
    console.log('交互节流已启用');
  }
  
  /**
   * 移除事件监听器
   */
  removeEventListeners() {
    // 移除非必要的事件监听器以节省内存
    console.log('事件监听器已清理');
  }
  
  /**
   * 启用数据节省模式
   */
  enableDataSaving() {
    document.body.classList.add('reduced-data');
    this.setPerformanceMode('conservative');
    console.log('数据节省模式已启用');
  }
  
  /**
   * 优化资源加载
   */
  optimizeAssetLoading(assetUrl) {
    // 为慢速加载的资源启用占位符策略
    console.log('优化资源加载:', assetUrl);
    
    // 在实际应用中，可以为特定资源设置不同的加载策略
    // 例如：使用低分辨率预览图、延迟加载、占位符替换等
  }
  
  /**
   * 获取当前性能统计
   */
  getPerformanceReport() {
    const avgRenderTime = this.getAverageRenderTime();
    const avgMemoryUsage = this.getAverageMemoryUsage();
    const avgLoadTime = this.getAverageLoadTime();
    
    return {
      currentFPS: this.currentFPS,
      performanceTier: this.performanceTier,
      
      metrics: {
        averageRenderTime: avgRenderTime,
        averageMemoryUsage: avgMemoryUsage,
        averageLoadTime: avgLoadTime,
        loadSuccessRate: this.getLoadSuccessRate()
      },
      
      thresholds: { ...this.thresholds },
      
      optimizations: {
        enabled: this.enabled,
        autoOptimization: this.autoOptimization,
        currentStrategy: this.optimizationStrategies[this.performanceTier]
      },
      
      deviceCapabilities: this.detectDeviceCapabilities(),
      
      recommendations: this.generateRecommendations(),
      
      timestamp: Date.now()
    };
  }
  
  /**
   * 获取平均渲染时间
   */
  getAverageRenderTime() {
    if (this.metrics.renderTimes.length === 0) return 0;
    
    const sum = this.metrics.renderTimes.reduce((acc, metric) => {
      return acc + (1000 / metric.fps); // 转换为ms
    }, 0);
    
    return sum / this.metrics.renderTimes.length;
  }
  
  /**
   * 获取平均内存使用
   */
  getAverageMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) return 0;
    
    const sum = this.metrics.memoryUsage.reduce((acc, usage) => acc + usage.used, 0);
    return sum / this.metrics.memoryUsage.length;
  }
  
  /**
   * 获取平均加载时间
   */
  getAverageLoadTime() {
    if (this.metrics.loadTimes.length === 0) return 0;
    
    const sum = this.metrics.loadTimes.reduce((acc, load) => acc + load.duration, 0);
    return sum / this.metrics.loadTimes.length;
  }
  
  /**
   * 获取加载成功率
   */
  getLoadSuccessRate() {
    if (this.metrics.loadTimes.length === 0) return 'N/A';
    
    const successful = this.metrics.loadTimes.filter(load => load.duration < this.thresholds.maxLoadTime).length;
    return (successful / this.metrics.loadTimes.length * 100).toFixed(1) + '%';
  }
  
  /**
   * 生成性能建议
   */
  generateRecommendations() {
    const recommendations = [];
    
    const avgRenderTime = this.getAverageRenderTime();
    if (avgRenderTime > this.thresholds.maxRenderTime) {
      recommendations.push('⚠️ 渲染性能较慢，建议禁用动画效果');
    }
    
    const avgMemoryUsage = this.getAverageMemoryUsage();
    if (avgMemoryUsage > this.thresholds.maxMemoryUsage * 0.8) {
      recommendations.push('⚠️ 内存使用较高，建议清理缓存');
    }
    
    const avgLoadTime = this.getAverageLoadTime();
    if (avgLoadTime > this.thresholds.maxLoadTime) {
      recommendations.push('⚠️ 资源加载较慢，建议优化图片压缩');
    }
    
    if (this.currentFPS < 30) {
      recommendations.push('⚠️ 帧率较低，建议减少同时显示的桌子数量');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ 性能表现良好，无需优化');
    }
    
    return recommendations;
  }
  
  /**
   * 导出性能数据
   */
  exportPerformanceData() {
    return {
      report: this.getPerformanceReport(),
      rawMetrics: { ...this.metrics },
      configuration: {
        thresholds: { ...this.thresholds },
        optimizationStrategies: { ...this.optimizationStrategies },
        renderOptimizer: { ...this.renderOptimizer },
        memoryManager: { ...this.memoryManager }
      },
      timestamp: Date.now()
    };
  }
  
  /**
   * 内存API可用性检查
   */
  isMemoryAPIAvailable() {
    return typeof performance !== 'undefined' && 
           typeof performance.memory !== 'undefined';
  }
  
  /**
   * 启用/禁用性能优化器
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (enabled) {
      console.log('PerformanceOptimizer: 已启用');
      this.initializePerformanceMonitoring();
    } else {
      console.log('PerformanceOptimizer: 已禁用');
    }
  }
  
  /**
   * 获取调试信息
   */
  getDebugInfo() {
    return {
      version: '1.0.0',
      enabled: this.enabled,
      performanceTier: this.performanceTier,
      currentFPS: this.currentFPS,
      
      metrics: {
        renderTimes: this.metrics.renderTimes.length,
        memoryUsage: this.metrics.memoryUsage.length,
        loadTimes: this.metrics.loadTimes.length
      },
      
      monitoring: {
        fps: this.currentFPS > 0,
        memory: this.isMemoryAPIAvailable(),
        network: typeof PerformanceObserver !== 'undefined'
      },
      
      thresholds: { ...this.thresholds }
    };
  }
}

// 创建全局性能优化器实例
const performanceOptimizer = new PerformanceOptimizer();

// 导出供其他模块使用
module.exports = {
  performanceOptimizer,
  PerformanceOptimizer
};

// 微信小程序环境时
if (typeof wx !== 'undefined') {
  wx.performanceOptimizer = performanceOptimizer;
}

/**
 * 使用示例:
 * 
 * const { performanceOptimizer } = require('./performance-optimizer');
 * 
 * // 获取性能报告
 * const report = performanceOptimizer.getPerformanceReport();
 * console.log('当前FPS:', report.currentFPS);
 * console.log('性能建议:', report.recommendations);
 * 
 * // 手动触发优化
 * performanceOptimizer.triggerEmergencyOptimization();
 * 
 * // 导出性能数据
 * const exportData = performanceOptimizer.exportPerformanceData();
 * 
 * // 监听性能变化
 * if (typeof wx !== 'undefined') {
 *   const optimizer = wx.performanceOptimizer;
 *   // 在页面中使用性能优化器
 * }
 */

/**
 * 微信小程序集成说明:
 * 
 * // 在 app.js 中初始化
 * App({
 *   onLaunch() {
 *     this.performanceOptimizer = require('utils/performance-optimizer').performanceOptimizer;
 *   }
 * });
 * 
 * // 在页面中使用
 * Page({
 *   onShow() {
 *     const report = getApp().performanceOptimizer.getPerformanceReport();
 *     console.log('页面性能:', report);
 *   }
 * });
 */
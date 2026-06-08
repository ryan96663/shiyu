/**
 * Resource Loader - 资源加载器
 * 统一的资源预加载、缓存管理和降级策略系统
 * 符合设计方案的轻量化和确定性要求
 */

class ResourceManager {
  constructor(options = {}) {
    
    // 资源配置
    this.config = {
      maxConcurrentLoads: options.maxConcurrentLoads || 3,
      preloadTimeout: options.preloadTimeout || 5000,
      cacheMaxAge: options.cacheMaxAge || 1000 * 60 * 60 * 24, // 1天
      retryAttempts: options.retryAttempts || 2,
      retryDelay: options.retryDelay || 1000
    };
    
    // 缓存存储
    this.imageCache = new Map(); 
    this.failedLoads = new Set();
    this.loadingQueue = [];
    this.activeLoads = 0;
    
    // 加载队列管理
    this.loadListeners = new Map();
    this.loadQueues = {
      critical: [], // 关键资源，立即加载
      high: [],     // 高优先级，优先加载
      normal: [],   // 普通优先级
      low: []       // 低优先级，懒加载
    };
    
    // 预加载状态跟踪
    this.preloadStatus = {
      total: 0,
      loaded: 0,
      failed: 0,
      pending: 0,
      startTime: null,
      endTime: null
    };
    
    // 性能监控
    this.performanceMetrics = {
      totalLoadTime: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      retryCount: 0
    };
    
    // 降级策略映射
    this.fallbackStrategies = {
      
      // 家具文件映射
      '/mock-assets/furniture/table_4.png': {
        type: 'critical',
        fallbacks: [
          '/mock-assets/fallbacks/placeholder-table.png',
          'css:placeholder-table_4', 
          'css:minimal-table'
        ]
      },
      '/mock-assets/furniture/person.png': {
        type: 'critical', 
        fallbacks: [
          '/mock-assets/fallbacks/placeholder-person.png',
          'css:placeholder-person',
          'text:👤'
        ]
      },
      '/mock-assets/furniture/chair.png': {
        type: 'critical',
        fallbacks: [
          '/mock-assets/fallbacks/placeholder-chair.png',
          'css:placeholder-chair'
        ]
      },
      
      // 背景文件映射
      '/mock-assets/backgrounds/window-day.png': {
        type: 'high',
        alternatives: 'css-bg:linear-gradient(180deg,#87CEEB 0%,#B0E0E6 100%)'
      },
      '/mock-assets/backgrounds/window-night.png': {
        type: 'high', 
        alternatives: 'css-bg:linear-gradient(180deg,#191970 0%,#2F2F6F 100%)'
      },
      
      // 人物角色映射
      '/mock-assets/characters/waiter.png': {
        type: 'normal',
        fallbacks: [
          '/mock-assets/fallbacks/placeholder-person.png',
          'text:👨‍🍳'
        ]
      },
      
      // 装饰品（可降级）
      '/mock-assets/backgrounds/decor/painting.png': {
        type: 'low',
        skipOnError: true
      }
    };
    
    console.log('🔧 ResourceManager: 资源管理器初始化完成');
  }
  
  /**
   * 预加载关键资源
   */
  async preloadCriticalAssets(assetList = []) {
    
    console.log('📦 ResourceManager: 开始预加载关键资源');
    this.preloadStatus.startTime = Date.now();
    
    // 如果没有指定，使用默认关键资源列表
    if (assetList.length === 0) {
      assetList = this.getDefaultCriticalAssets();
    }
    
    this.preloadStatus.total = assetList.length;
    this.preloadStatus.pending = assetList.length;
    
    // 将资源添加到队列
    assetList.forEach(asset => {
      const strategy = this.fallbackStrategies[asset] || { type: 'normal' };
      this.addToQueue(asset, strategy.type, () => {
        this.preloadStatus.pending--;
        if (this.preloadStatus.pending === 0) {
          this.completePreload();
        }
      });
    });
    
    // 开始处理队列
    await this.processQueue();
    
    return this.preloadStatus;
  }
  
  /**
   * 获取默认关键资源列表
   */
  getDefaultCriticalAssets() {
    return [
      '/mock-assets/furniture/table_4.png',
      '/mock-assets/furniture/chair.png', 
      '/mock-assets/furniture/person.png',
      '/mock-assets/characters/waiter.png',
      '/mock-assets/backgrounds/window-day.png',
      '/mock-assets/backgrounds/window-night.png'
    ];
  }
  
  /**
   * 添加到加载队列
   */
  addToQueue(url, priority, onComplete) {
    const queueItem = {
      url,
      priority,
      timestamp: Date.now(),
      retries: 0,
      onComplete
    };
    
    // 根据优先级添加到对应队列
    const queue = this.loadQueues[priority] || this.loadQueues.normal;
    queue.push(queueItem);
    
    // 立即处理高优先级队列
    if (priority === 'critical') {
      this.processQueueImmediately();
    }
  }
  
  /**
   * 处理加载队列
   */
  async processQueue(immediate = false) {
    // 如果正在处理中且有活动加载，则跳过
    if (!immediate && this.activeLoads >= this.config.maxConcurrentLoads) {
      return;
    }
    
    // 按优先级获取下一个任务
    const task = this.getNextTask();
    if (!task) return;
    
    // 开始加载
    await this.loadResource(task);
    
    // 递归处理
    if (this.loadingQueue.length > 0 || this.hasQueuedTasks()) {
      setTimeout(() => this.processQueue(), 10);
    }
  }
  
  /**
   * 立即处理队列（用于关键资源）
   */
  processQueueImmediately() {
    while (this.activeLoads < this.config.maxConcurrentLoads) {
      const task = this.getNextTask();
      if (!task) break;
      
      this.loadResource(task);
    }
  }
  
  /**
   * 获取下一个加载任务
   */
  getNextTask() {
    // 按优先级顺序检查队列
    const priorities = ['critical', 'high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queue = this.loadQueues[priority];
      if (queue.length > 0) {
        // 移动到待加载队列
        const task = queue.shift();
        this.loadingQueue.push(task);
        return task;
      }
    }
    
    return null;
  }
  
  /**
   * 检查是否有排队中的任务
   */
  hasQueuedTasks() {
    return Object.values(this.loadQueues).some(queue => queue.length > 0);
  }
  
  /**
   * 加载单个资源
   */
  async loadResource(task) {
    this.activeLoads++;
    
    try {
      // 检查缓存
      const cached = this.getCached(task.url);
      if (cached) {
        this.performanceMetrics.cacheHitRate++;
        this.onLoadSuccess(task.url, cached);
        return cached;
      }
      
      // 检查是否已经失败过
      if (this.failedLoads.has(task.url)) {
        throw new Error(`资源已标记为失败: ${task.url}`);
      }
      
      // 实际加载
      const startTime = Date.now();
      const result = await this.loadImage(task.url);
      const loadTime = Date.now() - startTime;
      
      // 更新性能统计
      this.performanceMetrics.totalLoadTime += loadTime;
      
      // 缓存结果
      const assetData = {
        url: task.url,
        data: result,
        timestamp: Date.now(),
        loadTime,
        size: this.estimateSize(result)
      };
      
      this.setCache(task.url, assetData);
      this.onLoadSuccess(task.url, assetData);
      
      return assetData;
      
    } catch (error) {
      console.warn(`📦 ResourceManager: 加载失败 ${task.url}`, error);
      
      // 重试逻辑
      if (task.retries < this.config.retryAttempts) {
        task.retries++;
        this.performanceMetrics.retryCount++;
        
        // 将任务重新添加到队列
        setTimeout(() => {
          this.loadQueues[task.priority].unshift(task);
        }, this.config.retryDelay * task.retries);
        
      } else {
        // 超过重试限制，使用降级策略
        this.failedLoads.add(task.url);
        await this.handleFallback(task.url);
      }
      
    } finally {
      this.activeLoads--;
      
      if (task.onComplete) {
        task.onComplete();
      }
    }
  }
  
  /**
   * 加载图片
   */
  async loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      const timeout = setTimeout(() => {
        reject(new Error(`加载超时: ${url}`));
      }, this.config.preloadTimeout);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error(`图片加载错误: ${url}`));
      };
      
      // 微信小程序兼容性处理
      if (typeof wx !== 'undefined') {
        // 微信小程序环境下，处理相对路径
        if (url.startsWith('/')) {
          url = url.substring(1);
        }
      }
      
      img.src = url;
    });
  }
  
  /**
   * 处理降级策略
   */
  async handleFallback(url) {
    const strategy = this.fallbackStrategies[url];
    if (!strategy) {
      this.onLoadFailure(url);
      return null;
    }
    
    // 尝试降级选项
    if (strategy.fallbacks) {
      for (const fallback of strategy.fallbacks) {
        try {
          const result = await this.processFallback(fallback);
          if (result) {
            this.onLoadSuccess(url, { fallback: true, data: result });
            return result;
          }
        } catch (error) {
          console.warn(`降级选项失败: ${fallback}, 错误:`, error);
        }
      }
    }
    
    // 使用CSS替代方案
    if (strategy.alternatives) {
      const result = this.processCSSFallback(strategy.alternatives);
      this.onLoadSuccess(url, { fallback: true, css: result });
      return result;
    }
    
    // 如果配置为可以跳过错误
    if (strategy.skipOnError) {
      console.log(`跳过非关键资源: ${url}`);
      this.onLoadSkipped(url);
      return null;
    }
    
    // 最终降级
    this.onLoadFailure(url);
    return null;
  }
  
  /**
   * 处理特定降级选项
   */
  async processFallback(fallback) {
    // 处理URL型降级
    if (fallback.startsWith('/')) {
      return await this.loadImage(fallback);
    }
    
    // 处理CSS类降级
    if (fallback.startsWith('css:')) {
      return { type: 'css', class: fallback.substring(4) };
    }
    
    // 处理文本降级
    if (fallback.startsWith('text:')) {
      return { type: 'text', content: fallback.substring(5) };
    }
  }
  
  /**
   * 处理CSS降级方案
   */
  processCSSFallback(cssSpec) {
    if (cssSpec.startsWith('css-bg:')) {
      return { 
        type: 'css-background', 
        value: cssSpec.substring(7) 
      };
    }
    
    return { type: 'css', value: cssSpec };
  }
  
  /**
   * 缓存管理
   */
  setCache(url, data) {
    this.imageCache.set(url, {
      ...data,
      cachedAt: Date.now()
    });
  }
  
  /**
   * 获取缓存
   */
  getCached(url) {
    const cached = this.imageCache.get(url);
    
    if (!cached) return null;
    
    // 检查缓存是否过期
    const age = Date.now() - cached.cachedAt;
    if (age > this.config.cacheMaxAge) {
      this.imageCache.delete(url);
      return null;
    }
    
    return cached;
  }
  
  /**
   * 清理缓存
   */
  clearCache() {
    this.imageCache.clear();
    this.failedLoads.clear();
    console.log('🧹 ResourceManager: 缓存已清理');
  }
  
  /**
   * 预加载完成
   */
  completePreload() {
    this.preloadStatus.endTime = Date.now();
    const duration = this.preloadStatus.endTime - this.preloadStatus.startTime;
    
    console.log('✅ ResourceManager: 预加载完成', {
      total: this.preloadStatus.total,
      loaded: this.preloadStatus.loaded,
      failed: this.preloadStatus.failed,
      duration: `${duration}ms`,
      successRate: ((this.preloadStatus.loaded / this.preloadStatus.total) * 100).toFixed(1) + '%'
    });
    
    // 通知监听器
    this.notifyPreloadComplete();
  }
  
  /**
   * 加载成功处理
   */
  onLoadSuccess(url, data) {
    this.preloadStatus.loaded++;
    
    // 通知监听器
    this.notifyListeners(url, {
      status: 'success',
      url,
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * 加载失败处理
   */ 
  onLoadFailure(url) {
    this.preloadStatus.failed++;
    
    this.notifyListeners(url, {
      status: 'failure',
      url,
      timestamp: Date.now()
    });
  }
  
  /**
   * 加载跳过处理
   */
  onLoadSkipped(url) {
    this.notifyListeners(url, {
      status: 'skipped', 
      url,
      timestamp: Date.now()
    });
  }
  
  /**
   * 添加加载监听器
   */
  addLoadListener(callback) {
    const id = Date.now() + Math.random();
    this.loadListeners.set(id, callback);
    return id;
  }
  
  /**
   * 移除加载监听器
   */
  removeLoadListener(id) {
    this.loadListeners.delete(id);
  }
  
  /**
   * 通知所有监听器
   */
  notifyListeners(url, data) {
    this.loadListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('ResourceManager: 监听器执行错误', error);
      }
    });
  }
  
  /**
   * 通知预加载完成
   */
  notifyPreloadComplete() {
    const event = {
      type: 'preload_complete',
      status: this.preloadStatus,
      performance: this.getPerformanceStats()
    };
    
    this.notifyListeners('preload_complete', event);
  }
  
  /**
   * 懒加载资源
   */
  lazyLoad(url, priority = 'low') {
    this.addToQueue(url, priority);
    setTimeout(() => this.processQueue(), 100);
  }
  
  /**
   * 批量预加载
   */
  async batchPreload(urls, options = {}) {
    const {
      priority = 'normal',
      onProgress = null
    } = options;
    
    let loaded = 0;
    const total = urls.length;
    
    for (const url of urls) {
      this.addToQueue(url, priority, () => {
        loaded++;
        if (onProgress) {
          onProgress({ loaded, total, url });
        }
      });
    }
    
    await this.processQueue();
    
    return {
      total,
      loaded: this.preloadStatus.loaded,
      failed: this.preloadStatus.failed
    };
  }
  
  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const totalReqs = this.preloadStatus.loaded + this.preloadStatus.failed;
    
    return {
      totalRequests: totalReqs,
      successCount: this.preloadStatus.loaded,
      failureCount: this.preloadStatus.failed,
      successRate: totalReqs > 0 ? (this.preloadStatus.loaded / totalReqs * 100).toFixed(1) + '%' : '0%',
      totalLoadTime: this.performanceMetrics.totalLoadTime,
      averageLoadTime: totalReqs > 0 ? (this.performanceMetrics.totalLoadTime / totalReqs).toFixed(2) + 'ms' : '0ms',
      cacheHitRate: this.performanceMetrics.cacheHitRate,
      retryCount: this.performanceMetrics.retryCount,
      cachedAssets: this.imageCache.size,
      failedAssets: this.failedLoads.size
    };
  }
  
  /**
   * 估算资源大小
   */
  estimateSize(img) {
    // 简单估算方法
    if (img && img.width && img.height) {
      return img.width * img.height * 4; // 假设RGBA 4字节/像素
    }
    return 0;
  }
  
  /**
   * 导出配置
   */
  exportConfig() {
    return {
      config: { ...this.config },
      fallbackStrategies: { ...this.fallbackStrategies },
      performance: this.getPerformanceStats(),
      cache: {
        size: this.imageCache.size,
        maxAge: this.config.cacheMaxAge
      }
    };
  }
  
  /**
   * 生成调试信息
   */
  getDebugInfo() {
    return {
      activeLoads: this.activeLoads,
      queuedTasks: Object.values(this.loadQueues).reduce((sum, queue) => sum + queue.length, 0),
      loadingQueue: this.loadingQueue.length,
      cache: {
        total: this.imageCache.size,
        failed: this.failedLoads.size
      },
      listeners: this.loadListeners.size,
      performance: this.getPerformanceStats()
    };
  }
}

// 全局资源管理器实例
const resourceManager = new ResourceManager({
  maxConcurrentLoads: 3,
  preloadTimeout: 5000,
  retryAttempts: 2,
  cacheMaxAge: 1000 * 60 * 60 * 24 // 1天
});

// 导出
module.exports = {
  resourceManager,
  ResourceManager
};

// 微信小程序模块导出
if (typeof wx !== 'undefined') {
  wx.resourceManager = resourceManager;
}

/**
 * 使用示例:
 * 
 * const { resourceManager } = require('./resource-loader');
 * 
 * // 预加载关键资源
 * resourceManager.preloadCriticalAssets()
 *   .then(status => {
 *     console.log('预加载完成:', status.loaded, '/', status.total);
 *   });
 * 
 * // 监听加载事件
 * const listenerId = resourceManager.addLoadListener((event) => {
 *   if (event.status === 'success') {
 *     console.log('✅ 加载成功:', event.url);
 *   } else if (event.status === 'failure') {
 *     console.log('❌ 加载失败:', event.url);
 *   }
 * });
 * 
 * // 懒加载单项资源
 * resourceManager.lazyLoad('/mock-assets/characters/waiter.png', 'high');
 * 
 * // 批量预加载
 * resourceManager.batchPreload([
 *   '/mock-assets/furniture/table_4.png',
 *   '/mock-assets/furniture/chair.png'
 * ], {
 *   priority: 'critical',
 *   onProgress: (progress) => {
 *     console.log(`进度: ${progress.loaded}/${progress.total}`);
 *   }
 * });
 * 
 * // 获取性能统计
 * const stats = resourceManager.getPerformanceStats();
 * console.log('加载成功率:', stats.successRate);
 * 
 * // 清理缓存
 * resourceManager.clearCache();
 */

/**
 * 微信小程序中使用:
 * 
 * // 在页面生命周期中
 * Page({
 *   onLoad() {
 *     // 预加载资源
 *     wx.resourceManager.preloadCriticalAssets()
 *       .catch(error => {
 *         console.error('预加载失败:', error);
 *       });
 *   },
 *   
 *   onUnload() {
 *     // 页面卸载时清理
 *     wx.resourceManager.clearCache();
 *   }
 * });
 */
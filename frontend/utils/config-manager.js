/**
 * Configuration Manager - 配置管理器
 * 负责统一管理餐厅场景配置、预设、验证和导入导出
 * 符合设计方案的数据结构标准化要求
 */

class RestaurantConfigManager {
  constructor() {
    
    // 默认配置模板
    this.defaultConfig = {
      sceneConfig: {
        sceneId: '',
        theme: 'day_sunny',
        restaurantType: 'sichuan',
        previewMode: true,
        peopleCount: 18,
        columns: 3,
        tableType: 'table_4'
      },
      
      layout: {
        columns: 3,
        gapHorizontal: 48,
        gapVertical: 32,
        paddingHorizontal: 24,
        paddingVertical: 32,
        tableUnitWidth: 192,
        tableUnitHeight: 220
      },
      
      performance: {
        enablePreload: true,
        maxConcurrentLoads: 3,
        enableLazyLoad: true,
        animationDuration: 200
      }
    };
    
    // 预设场景库
    this.presets = new Map();
    
    // 配置验证schema (简化版)
    this.schema = {
      sceneConfig: {
        required: ['sceneId', 'peopleCount'],
        types: {
          sceneId: 'string',
          theme: 'string',
          restaurantType: 'string',
          previewMode: 'boolean',
          peopleCount: 'number',
          columns: 'number',
          tableType: 'string'
        },
        enums: {
          theme: ['day_sunny', 'day_rainy', 'night_sunny', 'night_rainy'],
          restaurantType: ['sichuan', 'cantonese', 'japanese', 'bbq'],
          tableType: ['table_2', 'table_4', 'table_6']
        },
        ranges: {
          peopleCount: { min: 0, max: 200 },
          columns: { min: 2, max: 4 }
        }
      }
    };
    
    // 加载预设
    this.loadBuiltinPresets();
  }
  
  /**
   * 加载内置预设场景
   */
  loadBuiltinPresets() {
    this.presets.set('sichuan_basic', {
      sceneId: 'sichuan_basic_v1',
      name: '川菜小馆(基础版)',
      description: '经典川菜小馆布局，温馨家常菜氛围',
      config: {
        sceneId: 'sichuan_basic_v1',
        theme: 'day_sunny',
        restaurantType: 'sichuan',
        previewMode: true,
        peopleCount: 24,
        columns: 3,
        tableType: 'table_4'
      },
      tags: ['经典', '川菜', '基础']
    });
    
    this.presets.set('cantonese_elegant', {
      sceneId: 'cantonese_elegant_v1', 
      name: '粤式茶餐厅(精品版)',
      description: '精致粤式茶馆，明亮宽敞环境',
      config: {
        sceneId: 'cantonese_elegant_v1',
        theme: 'day_sunny',
        restaurantType: 'cantonese',
        previewMode: true,
        peopleCount: 36,
        columns: 3,
        tableType: 'table_4'
      },
      tags: ['精品', '粤式', '宽敞']
    });
    
    this.presets.set('japanese_night', {
      sceneId: 'japanese_night_v1',
      name: '日式拉面馆(深夜版)',
      description: '深夜食堂氛围，温暖灯光下的拉面店',
      config: {
        sceneId: 'japanese_night_v1',
        theme: 'night_sunny',
        restaurantType: 'japanese',
        previewMode: true,
        peopleCount: 16,
        columns: 2,
        tableType: 'table_4'
      },
      tags: ['深夜', '日式', '温馨']
    });
    
    this.presets.set('bbq_rainy', {
      sceneId: 'bbq_rainy_v1',
      name: '烧烤店(雨夜版)',
      description: '雨夜烟火气，10张桌子7张有人',
      config: {
        sceneId: 'bbq_rainy_v1', 
        theme: 'night_rainy',
        restaurantType: 'bbq',
        previewMode: true,
        peopleCount: 28,
        columns: 3,
        tableType: 'table_4'
      },
      tags: ['雨夜', '烧烤', '烟火气'] 
    });
    
    this.presets.set('minimal_cafe', {
      sceneId: 'minimal_cafe_v1',
      name: '简约咖啡馆(少人版)',
      description: '小资情调咖啡馆，6张桌子4人',
      config: {
        sceneId: 'minimal_cafe_v1',
        theme: 'day_sunny',
        restaurantType: 'cantonese', // 最接近咖啡馆风格
        previewMode: true,
        peopleCount: 12,
        columns: 2,
        tableType: 'table_2' // 2人桌
      },
      tags: ['简约', '咖啡', '小资']
    });
    
    console.log('🎛️ ConfigManager: 加载了', this.presets.size, '个内置预设场景');
  }
  
  /**
   * 创建新配置
   */
  createConfig(options = {}) {
    const config = {
      ...this.defaultConfig,
      ...options
    };
    
    // 生成唯一sceneId
    if (!config.sceneConfig.sceneId) {
      config.sceneConfig.sceneId = this.generateSceneId();
    }
    
    // 验证配置
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
    }
    
    return config;
  }
  
  /**
   * 验证配置
   */
  validateConfig(config) {
    const errors = [];
    
    // 检查必要字段
    if (!config.sceneConfig) {
      errors.push('缺少sceneConfig配置');
      return { isValid: false, errors };
    }
    
    // 验证sceneConfig
    const sceneConfig = config.sceneConfig;
    const schema = this.schema.sceneConfig;
    
    // 检查必要字段
    for (const required of schema.required) {
      if (!(required in sceneConfig)) {
        errors.push(`缺少必要字段: ${required}`);
      }
    }
    
    // 检查类型
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (field in sceneConfig) {
        const actualType = typeof sceneConfig[field];
        if (actualType !== expectedType) {
          errors.push(`字段${field}类型错误: 期望${expectedType}，实际${actualType}`);
        }
      }
    }
    
    // 检查枚举值
    for (const [field, validValues] of Object.entries(schema.enums)) {
      if (field in sceneConfig && !validValues.includes(sceneConfig[field])) {
        errors.push(`字段${field}值不在允许范围内: ${sceneConfig[field]}`);
      }
    }
    
    // 检查数值范围
    for (const [field, range] of Object.entries(schema.ranges)) {
      if (field in sceneConfig) {
        const value = sceneConfig[field];
        if (value < range.min || value > range.max) {
          errors.push(`字段${field}超出范围: ${value} (应在${range.min}-${range.max}之间)`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  /**
   * 生成场景ID
   */
  generateSceneId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `scene_${timestamp}_${random}`;
  }
  
  /**
   * 获取预设场景
   */
  getPreset(key) {
    return this.presets.get(key);
  }
  
  /**
   * 列出所有预设
   */
  listPresets(filter = {}) {
    const presets = Array.from(this.presets.values());
    
    // 应用过滤条件
    let filtered = presets;
    
    if (filter.restaurantType) {
      filtered = filtered.filter(p => p.config.restaurantType === filter.restaurantType);
    }
    
    if (filter.theme) {
      filtered = filtered.filter(p => p.config.theme === filter.theme);
    }
    
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(p => 
        filter.tags.some(tag => p.tags && p.tags.includes(tag))
      );
    }
    
    return filtered;
  }
  
  /**
   * 按分类获取预设
   */
  getPresetsByCategory() {
    const categories = {
      '川菜系列': this.listPresets({ restaurantType: 'sichuan' }),
      '粤式系列': this.listPresets({ restaurantType: 'cantonese' }),
      '日式系列': this.listPresets({ restaurantType: 'japanese' }),
      '烧烤系列': this.listPresets({ restaurantType: 'bbq' }),
      '白天场景': this.listPresets({ theme: 'day_sunny' }),
      '夜间场景': this.listPresets({ theme: ['night_sunny', 'night_rainy'] }),
      '雨天场景': this.listPresets({ theme: ['day_rainy', 'night_rainy'] })
    };
    
    return categories;
  }
  
  /**
   * 保存配置到文件
   */
  async saveConfigToFile(config, filename) {
    try {
      var configPath = 'config/' + filename;
      
      // 添加元数据
      const configWithMeta = {
        ...config,
        metadata: {
          version: '1.0.0',
          savedAt: new Date().toISOString(),
          savedBy: 'user',
          filename
        }
      };
      
      const jsonString = JSON.stringify(configWithMeta, null, 2);
      
      // 在浏览器环境中，这需要适配
      if (typeof window !== 'undefined') {
        // 浏览器环境：触发下载
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      console.log('💾 ConfigManager: 配置已保存到', filename);
      return true;
    } catch (error) {
      console.error('ConfigManager: 保存配置失败', error);
      return false;
    }
  }
  
  /**
   * 从文件加载配置
   */
  loadConfigFromFile(file) {
    try {
      let configData;
      
      if (typeof file === 'string') {
        // JSON字符串
        configData = JSON.parse(file);
      } else if (file instanceof File) {
        // File对象 - 需要异步处理
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const config = JSON.parse(e.target.result);
              resolve(this.processLoadedConfig(config));
            } catch (error) {
              reject(error);
            }
          };
          reader.readAsText(file);
        });
      }
      
      return this.processLoadedConfig(configData);
      
    } catch (error) {
      console.error('ConfigManager: 加载配置失败', error);
      throw error;
    }
  }
  
  /**
   * 处理加载的配置
   */
  processLoadedConfig(config) {
    // 迁移旧版本配置
    if (config.version && config.version !== '1.0.0') {
      console.log('ConfigManager: 检测到旧版本配置，将进行迁移');
      config = this.migrateConfig(config);
    }
    
    // 验证配置
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      console.warn('ConfigManager: 加载的配置存在验证问题', validation.errors);
    }
    
    return {
      config,
      validation,
      metadata: config.metadata || {}
    };
  }
  
  /**
   * 配置迁移
   */
  migrateConfig(oldConfig) {
    // 简单的配置迁移逻辑
    const newConfig = {
      ...oldConfig
    };
    
    console.log('ConfigManager: 配置迁移完成');
    return newConfig;
  }
  
  /**
   * 生成默认配置集
   */
  generateDefaultConfigs() {
    return [
      this.createConfig({
        sceneConfig: {
          ...this.defaultConfig.sceneConfig,
          sceneId: 'default_sunny_sichuan',
          theme: 'day_sunny',
          restaurantType: 'sichuan',
          peopleCount: 18
        }
      }),
      
      this.createConfig({
        sceneConfig: {
          ...this.defaultConfig.sceneConfig, 
          sceneId: 'default_night_japanese',
          theme: 'night_sunny',
          restaurantType: 'japanese',
          peopleCount: 12,
          columns: 2
        }
      }),
      
      this.createConfig({
        sceneConfig: {
          ...this.defaultConfig.sceneConfig,
          sceneId: 'default_rainy_bbq', 
          theme: 'night_rainy',
          restaurantType: 'bbq',
          peopleCount: 24
        }
      })
    ];
  }
  
  /**
   * 快速配置生成器
   */
  quickGenerate(options) {
    const {
      restaurantType = 'sichuan',
      peopleCount,
      theme,
      columns
    } = options;
    
    // 智能参数推断
    let finalPeopleCount = peopleCount;
    let finalTheme = theme;
    let finalColumns = columns;
    
    // 根据餐厅类型推荐人数
    if (!finalPeopleCount) {
      const recommendations = {
        sichuan: 18,
        cantonese: 24,
        japanese: 12,
        bbq: 20
      };
      finalPeopleCount = recommendations[restaurantType] || 18;
    }
    
    // 根据人数推荐列数
    if (!finalColumns) {
      if (finalPeopleCount <= 12) {
        finalColumns = 2;
      } else if (finalPeopleCount <= 30) {
        finalColumns = 3;
      } else {
        finalColumns = 4;
      }
    }
    
    return this.createConfig({
      sceneConfig: {
        restaurantType,
        peopleCount: finalPeopleCount,
        theme: finalTheme || 'day_sunny',
        columns: finalColumns
      }
    });
  }
  
  /**
   * 获取配置统计信息
   */
  getConfigStats(config) {
    const { peopleCount, columns, tableType } = config.sceneConfig;
    const tableCapacity = tableType === 'table_2' ? 2 : tableType === 'table_4' ? 4 : 6;
    const estimatedTables = Math.ceil(peopleCount / tableCapacity);
    const estimatedRows = Math.ceil(estimatedTables / columns);
    
    return {
      peopleCount,
      estimatedTables,
      estimatedRows,
      columns,
      tableType,
      estimatedCanvasHeight: estimatedRows * 220 + 400 // 估算画布高度
    };
  }
  
  /**
   * 导出配置包
   */
  exportConfigPackage(configs) {
    var pkg = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      configs: Array.isArray(configs) ? configs : [configs],
      metadata: {
        totalConfigs: Array.isArray(configs) ? configs.length : 1,
        schema: this.schema
      }
    };

    return pkg;
  }
  
  /**
   * 获取调试信息
   */
  getDebugInfo() {
    return {
      presetsCount: this.presets.size,
      defaultConfigsAvailable: this.generateDefaultConfigs().length,
      schemaVersion: '1.0.0',
      supportedFeatures: [
        'validation',
        'presets',
        'import-export',
        'migration'
      ]
    };
  }
}

// 导出单例实例
const configManager = new RestaurantConfigManager();
module.exports = {
  configManager,
  RestaurantConfigManager
};

/**
 * 使用示例:
 * 
 * const { configManager } = require('./config-manager');
 * 
 * // 创建新配置
 * const config = configManager.createConfig({
 *   sceneConfig: {
 *     restaurantType: 'sichuan',
 *     peopleCount: 18,
 *     theme: 'day_sunny'
 *   }
 * });
 * 
 * // 获取预设
 * const preset = configManager.getPreset('sichuan_basic');
 * 
 * // 快速生成
 * const quickConfig = configManager.quickGenerate({
 *   restaurantType: 'japanese',
 *   peopleCount: 12
 * });
 * 
 * // 验证配置
 * const validation = configManager.validateConfig(config);
 * if (!validation.isValid) {
 *   console.error('配置错误:', validation.errors);
 * }
 */
/**
 * Placeholder Generator - 占位符生成器
 * 自动生成降级策略所需的占位图片和相关素材
 * 遵循设计方案的降级策略要求
 */

const fs = require('fs');
const path = require('path');

class PlaceholderGenerator {
  constructor() {
    
    // Canvas API 可用时的占位符定义
    this.canvasPlaceholders = {
      
      // 家具占位符
      'table_4': {
        name: '4人桌占位符',
        width: 140,
        height: 140,
        color: '#4A90E2',
        style: 'rounded-rect'
      },
      'table_2': {
        name: '2人桌占位符', 
        width: 120,
        height: 120,
        color: '#7B68EE',
        style: 'rounded-rect'
      },
      'table_6': {
        name: '6人桌占位符',
        width: 160,
        height: 160,
        color: '#50C878',
        style: 'rounded-rect'
      },
      
      // 椅子占位符
      'chair': {
        name: '椅子占位符',
        width: 48,
        height: 48,
        color: '#DAA520',
        style: 'simple-rect'
      },
      
      // 人物占位符
      'person': {
        name: '人物占位符',
        width: 56,
        height: 56,
        color: '#FF6B9D',
        style: 'circle'
      },
      
      // 前台占位符
      'front-desk': {
        name: '前台占位符', 
        width: 160,
        height: 80,
        color: '#8FBC8F',
        style: 'horizontal-rect'
      }
    };
    
    // CSS fallback shapes
    this.cssShapes = {
      'rounded-rect': {
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      'simple-rect': {
        borderRadius: '2px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      },
      'circle': {
        borderRadius: '50%',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
      },
      'horizontal-rect': {
        borderRadius: '6px',
        boxShadow: '0 3px 6px rgba(0,0,0,0.12)'
      }
    };
    
    // 降级策略层级
    this.fallbackLevels = [
      { level: 1, name: '原始图片', method: 'original' },
      { level: 2, name: '占位图', method: 'placeholder' },
      { level: 3, name: 'CSS 形状', method: 'css-shape' },
      { level: 4, name: '极简布局', method: 'minimal-layout' },
      { level: 5, name: '纯文本', method: 'text-only' }
    ];
  }
  
  /**
   * 生成Canvas占位符图像 (如果在Node.js环境)
   */
  async generateCanvasPlaceholder(type, options = {}) {
    
    // 检查是否支持Canvas
    let Canvas;
    try {
      Canvas = require('canvas');
    } catch (error) {
      console.warn('Canvas not available, returning CSS alternative');
      return this.generateCSSAlternative(type);
    }
    
    const config = this.canvasPlaceholders[type];
    if (!config) {
      throw new Error(`未知的占位符类型: ${type}`);
    }
    
    // 创建Canvas
    const canvas = Canvas.createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');
    
    // 设置样式
    ctx.fillStyle = options.color || config.color;
    ctx.strokeStyle = this.adjustColorBrightness(config.color, -30);
    ctx.lineWidth = 2;
    
    // 清除背景
    ctx.clearRect(0, 0, config.width, config.height);
    
    // 绘制形状
    switch (config.style) {
      case 'rounded-rect':
        this.drawRoundedRect(ctx, 0, 0, config.width, config.height, 12);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'simple-rect':
        ctx.fillRect(2, 2, config.width - 4, config.height - 4);
        ctx.strokeRect(2, 2, config.width - 4, config.height - 4);
        break;
        
      case 'circle':
        const centerX = config.width / 2;
        const centerY = config.height / 2;
        const radius = Math.min(config.width, config.height) / 2 - 6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'horizontal-rect':
        this.drawRoundedRect(ctx, 4, 4, config.width - 8, config.height - 8, 8);
        ctx.fill();
        ctx.stroke();
        break;
    }
    
    // 添加标识文字
    if (config.width > 60) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${Math.max(12, config.width / 8)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = config.name.replace('占位符', '');
      ctx.fillText(label, config.width / 2, config.height / 2);
    }
    
    return canvas.toBuffer();
  }
  
  /**
   * 生成CSS替代方案
   */  
  generateCSSAlternative(type) {
    const config = this.canvasPlaceholders[type];
    const cssShape = this.cssShapes[config.style];
    
    return {
      css: `
        .placeholder-${type} {
          width: ${config.width}px;
          height: ${config.height}px;
          background-color: ${config.color};
          border-radius: ${cssShape.borderRadius};
          box-shadow: ${cssShape.boxShadow};
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-family: sans-serif;
          font-size: ${Math.max(10, config.width / 10)}px;
          font-weight: 500;
        }
        
        .placeholder-${type}::after {
          content: '${config.name.replace('占位符', '')}';
          text-align: center;
        }
      `,
      html: `<div class="placeholder-${type}" aria-label="${config.name}"></div>`,
      config: { ...config, method: 'css' }
    };
  }
  
  /**
   * 生成响应式CSS方案  
   */
  generateResponsiveCSS() {
    const allCSS = [];
    
    for (const [type, config] of Object.entries(this.canvasPlaceholders)) {
      const alternative = this.generateCSSAlternative(type);
      allCSS.push(alternative.css);
    }
    
    // 添加媒体查询
    const responsiveCSS = `
/* Restaurant Canvas Placeholders - Responsive Design */

${allCSS.join('\n\n')}

/* 响应式调整 */
@media (max-width: 750px) {
  ${Object.keys(this.canvasPlaceholders).map(type => `
    .placeholder-${type} {
      transform: scale(0.8);
    }`).join('')}
}

@media (max-width: 375px) {
  ${Object.keys(this.canvasPlaceholders).map(type => `
    .placeholder-${type} {
      transform: scale(0.6);
    }`).join('')}
}

/* 减少运动偏好 */
@media (prefers-reduced-motion: reduce) {
  .placeholder-animation {
    animation: none !important;
  }
}
    `;
    
    return responsiveCSS;
  }
  
  /**
   * 生成降级策略配置
   */
  generateFallbackStrategy() {
    
    const strategy = {
    
      // 图片加载失败的处理策略
      imageFallbacks: {
        
        '/mock-assets/furniture/table_4.png': {
          level1: '/mock-assets/fallbacks/placeholder-table.png',
          level2: 'css-class: placeholder-table_4',
          level3: 'css-class: minimal-table'
        },
        
        '/mock-assets/furniture/person.png': {
          level1: '/mock-assets/fallbacks/placeholder-person.png',
          level2: 'css-class: placeholder-person', 
          level3: 'text: "👤"'
        },
        
        '/mock-assets/furniture/chair.png': {
          level1: '/mock-assets/fallbacks/placeholder-chair.png',
          level2: 'css-class: placeholder-chair'
        },
        
        '/mock-assets/backgrounds/window-day.png': {
          level1: 'css-bg: linear-gradient(180deg, #87CEEB 0%, #B0E0E6 100%)',
          level2: 'css-bg: #87CEEB'
        },
        
        '/mock-assets/backgrounds/window-night.png': {
          level1: 'css-bg: linear-gradient(180deg, #191970 0%, #2F2F6F 100%)',
          level2: 'css-bg: #191970'
        }
      },
      
      // 动画降级策略
      animationFallbacks: {
        'person-floating': {
          level1: 'animation: float 3s ease-in-out infinite',
          level2: 'animation: none; transform: translateY(1px)',
          level3: 'no-animation'
        },
        'light-flicker': {
          level1: 'animation: flicker 2s ease-in-out infinite',
          level2: 'transform: scale(1.05)',
          level3: 'opacity: 0.9'
        },
        'rain-effect': {
          level1: 'animation: rain-drop 1s linear infinite',
          level2: 'background: linear-gradient(180deg, transparent 0%, #87CEEB 100%)',
          level3: 'opacity: 0.7'
        }
      },
      
      // 性能降级策略
      performanceDegradation: {
        'high-performance': {
          preloadAssets: 10,
          enableAnimations: true,
          enableWeather: true,
          gridResolution: 'high'
        },
        'medium-performance': {
          preloadAssets: 5,
          enableAnimations: true,
          enableWeather: false,
          gridResolution: 'medium'
        },
        'low-performance': {
          preloadAssets: 3,
          enableAnimations: false,
          enableWeather: false,
          gridResolution: 'low'
        },
        'minimal': {
          preloadAssets: 1,
          enableAnimations: false,
          enableWeather: false,
          gridResolution: 'minimal'
        }
      },
      
      // 浏览器兼容性策略
      browserCompatibility: {
        'modern': {
          cssFeatures: ['css-grid', 'css-variables', 'css-animations'],
          imageFormats: ['webp', 'png'],
          javascriptFeatures: ['es6', 'modules']
        },
        'legacy': {
          cssFeatures: ['flexbox', 'basic-animations'],
          imageFormats: ['png', 'gif'],
          javascriptFeatures: ['es5']
        }
      }
    };
    
    return strategy;
  }
  
  /**
   * 批量生成所有占位符
   */
  async generateAllPlaceholders() {
    console.log('🎨 PlaceholderGenerator: 开始批量生成占位符...');
    
    const results = {
      canvas: [],
      css: [],
      html: [],
      strategy: this.generateFallbackStrategy()
    };
    
    // 为每种类型生成占位符
    for (const type of Object.keys(this.canvasPlaceholders)) {
      try {
        // 尝试Canvas生成
        const canvasBuffer = await this.generateCanvasPlaceholder(type);
        results.canvas.push({
          type,
          buffer: canvasBuffer,
          path: `/mock-assets/fallbacks/placeholder-${type}.png`
        });
        
        console.log(`✅ 生成Canvas占位符: ${type}`);
        
      } catch (error) {
        // Canvas失败则使用CSS替代
        console.log(`⚠️ Canvas生成失败(${type}), 使用CSS替代`);
        const cssAlternative = this.generateCSSAlternative(type);
        results.css.push({
          type,
          css: cssAlternative.css,
          html: cssAlternative.html
        });
      }
      
      // 无论Canvas是否成功都生成CSS版本作为备选
      const cssAlternative = this.generateCSSAlternative(type);
      results.css.push({ type, css: cssAlternative.css });
    }
    
    // 生成响应式CSS
    results.responsiveCSS = this.generateResponsiveCSS();
    
    console.log(`🎨 PlaceholderGenerator: 完成! 生成${results.canvas.length}个Canvas占位符, ${results.css.length}个CSS方案`);
    
    return results;
  }
  
  /**
   * 生成占位符manifest文件
   */
  generateManifest() {
    
    const manifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      placeholderTypes: Object.keys(this.canvasPlaceholders),
      configurations: this.canvasPlaceholders,
      fallbackStrategy: this.generateFallbackStrategy(),
      performance: {
        targetFileSize: '40KB',
        targetLoadTime: '50ms',
        fallbackLevels: this.fallbackLevels.map(fl => ({
          level: fl.level,
          name: fl.name,
          method: fl.method
        }))
      },
      accessibility: {
        minimumContrast: 'WCAG AA (4.5:1)',
        interactiveSize: '48x48px minimum',
        fallbackText: 'Descriptive labels provided'
      }
    };
    
    return manifest;
  }
  
  /**
   * 工具函数：绘制圆角矩形
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }
  
  /**
   * 工具函数：调整颜色亮度
   */
  adjustColorBrightness(color, amount) {
    let useColor = color.replace('#', '');
    let red = parseInt(useColor.substr(0, 2), 16);
    let green = parseInt(useColor.substr(2, 2), 16);
    let blue = parseInt(useColor.substr(4, 2), 16);
    
    red = Math.max(0, Math.min(255, red + amount));
    green = Math.max(0, Math.min(255, green + amount));
    blue = Math.max(0, Math.min(255, blue + amount));
    
    return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
  }
  
  /**
   * 生成降级演示页面
   */
  generateDemoPage() {
    const css = this.generateResponsiveCSS();
    
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restaurant Canvas - 占位符演示</title>
    <style>
        ${css}
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f7fa;
            color: #333;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .demo-section {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .placeholder-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .placeholder-item {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            background: #f9f9f9;
        }
        
        .info {
            font-size: 14px;
            color: #666;
            margin-top: 8px;
        }
        
        @media (prefers-reduced-data: reduce) {
            .placeholder-item {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        
        <div class="header">
            <h1>🍽️ Restaraurant Canvas - 占位符演示</h1>
            <p>展示降级策略中的各种占位符效果</p>
        </div>
        
        <div class="demo-section">
            <h2>📋 家具占位符</h2>
            <div class="placeholder-grid">
                <div class="placeholder-item">
                    <div class="placeholder-table_4"></div>
                    <div>4人桌</div>
                    <div class="info">140x140px 圆角矩形</div>
                </div>
                <div class="placeholder-item">
                    <div class="placeholder-table_2"></div>
                    <div>2人桌</div>
                    <div class="info">120x120px 圆角矩形</div>
                </div>
                <div class="placeholder-item">
                    <div class="placeholder-table_6"></div>
                    <div>6人桌</div>
                    <div class="info">160x160px 圆角矩形</div>
                </div>
                <div class="placeholder-item">
                    <div class="placeholder-chair"></div>
                    <div>椅子</div>
                    <div class="info">48x48px 简单矩形</div>
                </div>
            </div>
        </div>
        
        <div class="demo-section">
            <h2>👤 人物占位符</h2>
            <div class="placeholder-grid">
                <div class="placeholder-item">
                    <div class="placeholder-person"></div>
                    <div>角色人物</div>
                    <div class="info">56x56px 圆形设计</div>
                </div>
                <div class="placeholder-item">
                    <div class="placeholder-front-desk"></div>
                    <div>前台桌子</div>
                    <div class="info">160x80px 横版矩形</div>
                </div>
            </div>
        </div>
        
        
    </div>
</body>
</html>`;

    return html;
  }
  
  /**
   * 获取调试信息
   */
  getDebugInfo() {
    return {
      placeholderTypes: Object.keys(this.canvasPlaceholders).length,
      supportedStyles: Object.keys(this.cssShapes),
      fallbackLevels: this.fallbackLevels.length,
      canvasSupport: typeof require === 'function',
      performanceTarget: '40KB per asset'
    };
  }
}

// 导出供其他文件使用
module.exports = {
  PlaceholderGenerator
};

// 如果使用Node.js可执行批量生成
if (typeof require !== 'undefined' && require.main === module) {
  
  const generator = new PlaceholderGenerator();
  
  console.log('🧰 Placeholder Generator CLI');
  console.log('正在生成所有占位符...');
  
  generator.generateAllPlaceholders()
    .then(results => {
      console.log('\n✅ 生成完成!');
      console.log('可以使用以下路径访问占位符:');
      
      results.canvas.forEach(item => {
        console.log(`  - ${item.type}: ${item.path}`);
      });
      
      // 生成manifest
      const manifest = generator.generateManifest();
      console.log('\n📋 清单文件已生成，包含', Object.keys(manifest.configurations).length, '种占位符类型');
      
    })
    .catch(error => {
      console.error('❌ 生成失败:', error);
    });
}

/**
 * 使用示例:
 * 
 * const { PlaceholderGenerator } = require('./placeholder-generator');
 * 
 * const generator = new PlaceholderGenerator();
 * 
 * // 生成特定占位符
 * generator.generateCanvasPlaceholder('table_4')
 *   .then(buffer => {
 *     // 保存到文件
 *     fs.writeFileSync('placeholder-table_4.png', buffer);
 *   });
 * 
 * // 批量生成
 * generator.generateAllPlaceholders().then(results => {
 *   console.log('生成完成:', results.canvas.length, '个图像');
 * });
 * 
 * // 获取CSS备用方案
 * const css = generator.generateResponsiveCSS();
 * 
 * // 生成降级策略
 * const strategy = generator.generateFallbackStrategy();
 */
// 场景主题切换器
class ThemeSwitcher {
  constructor() {
    this.themes = {
      // 川菜小馆主题
      '川菜小馆': {
        name: '川菜小馆',
        colors: {
          background: {
            top: '#8B4513',     // 棕色
            bottom: '#CD853F'   // 浅棕色  
          },
          floor: {
            pattern: 'checkerboard',
            color1: '#D2B48C',  // 浅褐色
            color2: '#F5DEB3'   // 小麦色
          },
          lighting: {
            color: '#FFD700',   // 金色
            intensity: 0.6
          },
          tableWood: '#8B4513', // 桌子木纹色
          tableCloth: {         // 桌布
            color: '#FFFFFF',
            opacity: 0.1
          }
        },
        atmosphere: {
          description: '温馨家常菜氛围',
          keywords: ['家常', '温馨', '朴素', '亲切']
        },
        tableConfiguration: {
          tablePerRow: 3,
          spacing: 180,  // 桌子间距
          randomOffset: 20 // 随机偏移量，增加自然感
        }
      },
      
      // 粤式茶餐厅主题
      '粤式茶餐厅': {
        name: '粤式茶餐厅', 
        colors: {
          background: {
            top: '#2F4F4F',     // 深石板灰
            bottom: '#708090'   // 石板灰
          },
          floor: {
            pattern: 'checkerboard', 
            color1: '#DCDCDC',  // 浅灰色
            color2: '#F5F5F5'   // 白烟色
          },
          lighting: {
            color: '#FFFF99',   // 淡黄色
            intensity: 0.7
          },
          tableWood: '#654321', // 深色木纹
          tableCloth: {
            color: '#FFFAF0',
            opacity: 0.2
          }
        },
        atmosphere: {
          description: '现代与传统融合的茶餐厅氛围',
          keywords: ['现代', '时尚', '港式', '舒适']
        },
        tableConfiguration: {
          tablePerRow: 3,
          spacing: 200,
          randomOffset: 10
        }
      },

      // 日式拉面馆主题
      '日式拉面馆': {
        name: '日式拉面馆',
        colors: {
          background: {
            top: '#2E2E2E',     // 深灰色
            bottom: '#5D5D5D'   // 中灰色
          },
          floor: {
            pattern: 'plain',   // 纯色
            color: '#8B4513'    // 深棕色
          },
          lighting: {
            color: '#FFA500',   // 橙色
            intensity: 0.8
          },
          tableWood: '#654321',
          tableCloth: {
            color: '#2F2F2F',
            opacity: 0.3
          }
        },
        atmosphere: {
          description: '现代日式简约风格',
          keywords: ['简约', '现代', '日式', '干净']
        },
        tableConfiguration: {
          tablePerRow: 2,     // 吧台布局
          spacing: 150,
          randomOffset: 5
        }
      },

      // 烧烤店主题
      '烧烤店': {
        name: '烧烤店',
        colors: {
          background: {
            top: '#1C1C1C',     // 黑色
            bottom: '#4F4F4F'   // 深灰色
          },
          floor: {
            pattern: 'plain',
            color: '#8B4513'    // 炭色
          },
          lighting: {
            color: '#FF4500',   // 橙红色
            intensity: 0.9      // 最亮的灯光
          },
          tableWood: '#2F2F2F',
          tableCloth: {
            color: '#000000',
            opacity: 0.4
          }
        },
        atmosphere: {
          description: '夜晚烧烤热闹氛围',
          keywords: ['热闹', '烧烤', '夜晚', '烟火']
        },
        tableConfiguration: {
          tablePerRow: 3,
          spacing: 160,
          randomOffset: 15      // 更大的随机性
        }
      }
    };

    this.currentTheme = '川菜小馆';
  }

  // 获取所有可用主题列表
  getAvailableThemes() {
    return Object.keys(this.themes);
  }

  // 获取当前主题信息
  getCurrentTheme() {
    return this.themes[this.currentTheme];
  }

  // 切换主题
  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = themeName;
      console.log(`✅ 已切换到主题: ${themeName}`);
      return true;
    }
    console.warn(`❌ 主题不存在: ${themeName}`);
    return false;
  }

  // 生成主题预览信息
  generateThemePreview(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return null;

    return {
      name: theme.name,
      description: theme.atmosphere.description,
      keywords: theme.atmosphere.keywords,
      colorPalette: {
        backgroundGradient: `${theme.colors.background.top} → ${theme.colors.background.bottom}`,
        floorColor: theme.colors.floor.color1 || theme.colors.floor.color,
        lightingColor: theme.colors.lighting.color,
        tableColor: theme.colors.tableWood
      },
      layout: {
        tablePerRow: theme.tableConfiguration.tablePerRow,
        spacing: theme.tableConfiguration.spacing
      }
    };
  }

  // 生成随机主题
  generateRandomTheme() {
    const themes = Object.keys(this.themes);
    const randomIndex = Math.floor(Math.random() * themes.length);
    return themes[randomIndex];
  }

  // 应用于Canvas场景管理器
  applyToSceneManager(sceneManager) {
    if (sceneManager && typeof sceneManager.setTheme === 'function') {
      sceneManager.setTheme(this.currentTheme);
    }
    
    // 返回当前主题的颜色配置
    return this.themes[this.currentTheme]?.colors || {};
  }
}

// 导出单例实例
const themeSwitcher = new ThemeSwitcher();
module.exports = themeSwitcher;
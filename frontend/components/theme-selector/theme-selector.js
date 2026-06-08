// 主题选择器组件
Component({
  properties: {
    currentTheme: {
      type: String,
      value: '川菜小馆'
    },
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    themes: [
      {
        id: '川菜小馆',
        name: '川菜小馆',
        description: '温馨家常菜氛围',
        icon: '/images/themes/sichuan.png',
        preview: {
          background: '#8B4513',
          accent: '#CD853F'
        }
      },
      {
        id: '粤式茶餐厅', 
        name: '粤式茶餐厅',
        description: '现代与传统融合',
        icon: '/images/themes/cantonese.png',
        preview: {
          background: '#2F4F4F',
          accent: '#708090'
        }
      },
      {
        id: '日式拉面馆',
        name: '日式拉面馆', 
        description: '简约现代风格',
        icon: '/images/themes/japanese.png',
        preview: {
          background: '#2E2E2E',
          accent: '#5D5D5D'
        }
      },
      {
        id: '烧烤店',
        name: '烧烤店',
        description: '夜晚热闹氛围',
        icon: '/images/themes/bbq.png',
        preview: {
          background: '#1C1C1C',
          accent: '#4F4F4F'
        }
      }
    ],
    animation: null,
    showAnimation: false
  },

  lifetimes: {
    created() {
      this.animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease'
      });
    }
  },

  methods: {

    // 切换主题
    switchTheme(e) {
      const selectedTheme = e.currentTarget.dataset.theme;
      
      if (selectedTheme === this.data.currentTheme) {
        this.close();
        return;
      }

      // 触发动画
      this.animation.opacity(0.3).step({ duration: 150 });
      this.setData({ 
        animationData: this.animation.export(),
        isSwitching: true,
        currentTheme: selectedTheme 
      });

      // 延迟触发主题切换事件
      setTimeout(() => {
        this.triggerEvent('themechange', {
          theme: selectedTheme,
          timestamp: Date.now()
        });
        
        // 恢复动画
        this.animation.opacity(1).step({ duration: 150 });
        this.setData({ 
          animationData: this.animation.export(),
          isSwitching: false
        });

        this.close();
      }, 200);
    },

    // 显示主题选择器
    show() {
      if (this.data.visible) return;
      
      // 入场动画
      this.animation.translateY('100%').step({ duration: 0 });
      this.animation.translateY(0).step({ duration: 300 });
      
      this.setData({ 
        visible: true,
        showAnimation: true,
        animationData: this.animation.export()
      });
      
      // 发送显示事件
      this.triggerEvent('show');
    },

    // 隐藏主题选择器
    close() {
      if (!this.data.visible) return;

      // 出场动画
      this.animation.translateY('100%').step({ duration: 300 });
      this.setData({ animationData: this.animation.export() });

      setTimeout(() => {
        this.setData({ 
          visible: false,
          showAnimation: false
        });
        
        // 重置动画
        this.animation.translateY('100%').step({ duration: 0 });
        
        // 发送关闭事件
        this.triggerEvent('close');
      }, 300);
    },

    // 预览主题
    previewTheme(e) {
      const theme = e.currentTarget.dataset.theme;
      
      this.triggerEvent('preview', {
        theme: theme,
        preview: true
      });
    },

    // 阻止事件冒泡
    stopPropagation() {
      // 防止点击穿透
    }

  }
});
// 扔漂流瓶页面逻辑
Page({
  /**
   * 页面数据
   */
  data: {
    content: '',
    question: '',
    contentCount: 0,
    questionCount: 0,
    hasQuestion: false,
    questionVisible: false,
    selectedTags: [],
    availableTags: [
      '美食', '旅游', '生活', '学习', '工作', '心情',
      '推荐', '吐槽', '求助', '交友', '音乐', '电影'
    ],
    area: '未知地区',
    showToast: false,
    toastMessage: ''
  },

  /**
   * 页面生命周期：加载
   */
  onLoad() {
    // 获取用户所在区域
    this.getUserArea();
  },

  /**
   * 获取用户区域
   */
  getUserArea() {
    try {
      // 从全局数据获取区域信息
      const app = getApp();
      const globalData = app.globalData || {};
      const storeInfo = globalData.currentStore || {};
      
      if (storeInfo.area) {
        this.setData({ area: storeInfo.area });
      } else {
        // 从本地存储获取
        const cachedArea = wx.getStorageSync('user_area');
        if (cachedArea) {
          this.setData({ area: cachedArea });
        }
      }
    } catch (error) {
      console.error('获取用户区域失败:', error);
    }
  },

  /**
   * 内容输入
   */
  onContentInput(e) {
    const content = e.detail.value;
    this.setData({
      content,
      contentCount: content.length
    });
  },

  /**
   * 问题输入
   */
  onQuestionInput(e) {
    const question = e.detail.value;
    this.setData({
      question,
      questionCount: question.length
    });
  },

  /**
   * 切换是否包含问题
   */
  onToggleQuestion() {
    const hasQuestion = !this.data.hasQuestion;
    this.setData({
      hasQuestion,
      questionVisible: true
    });

    if (!hasQuestion) {
      this.setData({
        question: '',
        questionCount: 0
      });
    }
  },

  /**
   * 选择标签
   */
  onTagSelect(e) {
    const tag = e.currentTarget.dataset.tag;
    const selectedTags = [...this.data.selectedTags];
    
    const index = selectedTags.indexOf(tag);
    if (index > -1) {
      selectedTags.splice(index, 1);
    } else {
      if (selectedTags.length < 3) {
        selectedTags.push(tag);
      }
    }
    
    this.setData({ selectedTags });
  },

  /**
   * 预设内容快速填充
   */
  onQuickInput(e) {
    const preset = e.currentTarget.dataset.preset;
    const presets = {
      'food_recommend': '这家店的招牌菜真的很不错，推荐给大家！',
      'ask_recommend': '人均100元左右有什么好的餐厅推荐吗？',
      'travel': '明天想去周边走走，有没有好的景点推荐？',
      'mood': '今天心情不太好，希望遇到有趣的灵魂聊天',
      'work': '最近工作压力有点大，大家怎么缓解压力呢？'
    };
    
    const presetContent = presets[preset] || '';
    this.setData({
      content: presetContent,
      contentCount: presetContent.length
    });
  },

  /**
   * 验证表单
   */
  validateForm() {
    const { content, hasQuestion, question } = this.data;
    
    if (content.trim().length === 0) {
      this.showToast('请输入漂流瓶内容');
      return false;
    }

    if (content.length > 200) {
      this.showToast('内容不能超过200字');
      return false;
    }

    if (hasQuestion && question.trim().length === 0) {
      this.showToast('当包含问题时，问题内容不能为空');
      return false;
    }

    if (hasQuestion && question.length > 100) {
      this.showToast('问题不能超过100字');
      return false;
    }

    return true;
  },

  /**
   * 扔出漂流瓶
   */
  async onThrowBottle() {
    // 表单验证
    if (!this.validateForm()) {
      return;
    }

    try {
      wx.showLoading({
        title: '扔出漂流瓶...',
        mask: true
      });

      // 准备数据
      const bottleData = {
        content: this.data.content.trim(),
        question: this.data.hasQuestion ? this.data.question.trim() : '',
        tags: this.data.selectedTags,
        area: this.data.area
      };

      // 发送请求
      wx.request({
        url: `${getApp().globalData.apiBaseUrl}/bottle/throw`,
        method: 'POST',
        data: bottleData,
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('auth_token')}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          wx.hideLoading();
          
          if (res.statusCode === 200 && res.data.success) {
            this.showToast('漂流瓶扔出成功');
            
            // 延迟返回上一页
            setTimeout(() => {
              wx.navigateBack({
                delta: 1
              });
            }, 1500);
          } else {
            this.showToast(res.data.message || '扔漂流瓶失败');
          }
        },
        fail: (err) => {
          wx.hideLoading();
          this.showToast('网络请求失败');
        }
      });
    } catch (error) {
      console.error('扔漂流瓶失败:', error);
      wx.hideLoading();
      this.showToast('操作失败');
    }
  },

  /**
   * 显示提示
   */
  showToast(message) {
    this.setData({
      showToast: true,
      toastMessage: message
    });

    setTimeout(() => {
      this.setData({
        showToast: false,
        toastMessage: ''
      });
    }, 2000);
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '扔个漂流瓶，分享我的小故事',
      path: '/pages/bottle/throw',
      imageUrl: '/assets/images/bottle-throw.png'
    };
  }
});
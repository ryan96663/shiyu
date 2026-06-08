// 漂流瓶回复页面逻辑
Page({
  /**
   * 页面数据
   */
  data: {
    bottleId: '',
    bottleContent: '',
    bottleQuestion: '',
    hasQuestion: false,
    replyContent: '',
    replyCount: 0,
    loading: true,
    showToast: false,
    toastMessage: ''
  },

  /**
   * 页面生命周期：加载
   */
  onLoad(options) {
    const { bottleId, content, question, hasQuestion } = options;
    
    this.setData({
      bottleId,
      bottleContent: decodeURIComponent(content || ''),
      bottleQuestion: decodeURIComponent(question || ''),
      hasQuestion: hasQuestion === 'true'
    });

    this.loadBottleDetails(bottleId);
  },

  /**
   * 加载漂流瓶详情
   */
  async loadBottleDetails(bottleId) {
    try {
      // 这里可以调用后端API获取更详细的漂流瓶信息
      // 目前使用页面参数传递的数据
      this.setData({ loading: false });
    } catch (error) {
      console.error('加载漂流瓶详情失败:', error);
      this.showToast('加载失败');
      this.setData({ loading: false });
    }
  },

  /**
   * 回复内容输入
   */
  onReplyInput(e) {
    const content = e.detail.value;
    this.setData({
      replyContent: content,
      replyCount: content.length
    });
  },

  /**
   * 发送回复
   */
  async sendReply() {
    const content = this.data.replyContent.trim();
    if (!content) {
      this.showToast('请输入回复内容');
      return;
    }

    if (content.length > 200) {
      this.showToast('回复内容不能超过200字');
      return;
    }

    try {
      wx.showLoading({
        title: '发送中...',
        mask: true
      });

      // 发送回复到后端
      wx.request({
        url: `${getApp().globalData.apiBaseUrl}/bottle/${this.data.bottleId}/reply`,
        method: 'POST',
        data: { content },
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('auth_token')}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          wx.hideLoading();
          
          if (res.statusCode === 200 && res.data.success) {
            this.showToast('回复发送成功');
            
            // 延迟返回漂流瓶列表
            setTimeout(() => {
              wx.redirectTo({
                url: '/pages/bottle/list'
              });
            }, 1500);
          } else {
            this.showToast(res.data.message || '回复发送失败');
          }
        },
        fail: (err) => {
          wx.hideLoading();
          this.showToast('网络请求失败');
        }
      });
    } catch (error) {
      console.error('发送回复失败:', error);
      wx.hideLoading();
      this.showToast('发送失败');
    }
  },

  /**
   * 复制内容
   */
  copyContent(content) {
    if (!content) return;

    wx.setClipboardData({
      data: content,
      success: () => {
        this.showToast('内容已复制');
      },
      fail: () => {
        this.showToast('复制失败');
      }
    });
  },

  /**
   * 快速回复
   */
  onQuickReply(e) {
    const content = e.currentTarget.dataset.content;
    if (!content) return;
    
    this.setData({
      replyContent: content,
      replyCount: content.length
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack({
      delta: 1
    });
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
      title: '有趣的漂流瓶对话',
      path: `/pages/bottle/reply?bottleId=${this.data.bottleId}`,
      imageUrl: '/assets/images/bottle-reply.png'
    };
  }
});
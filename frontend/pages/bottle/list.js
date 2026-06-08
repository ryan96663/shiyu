// 漂流瓶管理页面逻辑
Page({
  /**
   * 页面数据
   */
  data: {
    activeTab: 'picked', // 当前标签页：picked(捞的) | thrown(扔的)
    pickedBottles: [],  // 我捞到的漂流瓶
    thrownBottles: [],  // 我扔的漂流瓶
    stats: {
      thrown: 0,
      picked: 0,
      replied: 0,
      receivedLikes: 0
    },
    loading: false,
    showReplyModal: false,
    selectedBottle: null,
    replyContent: '',
    showToast: false,
    toastMessage: ''
  },

  /**
   * 页面生命周期：加载
   */
  onLoad() {
    // 获取页面参数（如果有）
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    if (currentPage.options && currentPage.options.tab) {
      this.setData({ activeTab: currentPage.options.tab });
    }
    
    // 加载漂流瓶数据
    this.loadBottleData();
  },

  /**
   * 页面生命周期：显示
   */
  onShow() {
    // 页面显示时重新加载数据
    this.loadBottleData();
  },

  /**
   * 加载漂流瓶数据
   */
  async loadBottleData() {
    try {
      this.setData({ loading: true });

      // 获取用户信息
      const token = wx.getStorageSync('auth_token');
      if (!token) {
        wx.navigateTo({
          url: '/pages/login/index'
        });
        return;
      }

      // 并发加载漂流瓶列表和统计
      const [listResult, statsResult] = await Promise.all([
        this.fetchBottleList(),
        this.fetchBottleStats()
      ]);

      if (listResult.success) {
        this.setData({
          pickedBottles: listResult.data.picked || [],
          thrownBottles: listResult.data.thrown || []
        });
      }

      if (statsResult.success) {
        this.setData({
          stats: statsResult.data
        });
      }

      console.log('漂流瓶数据加载成功');
    } catch (error) {
      console.error('加载漂流瓶数据失败:', error);
      this.showToast('数据加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 获取漂流瓶列表
   */
  fetchBottleList() {
    return new Promise((resolve) => {
      wx.request({
        url: `${getApp().globalData.apiBaseUrl}/bottle/list`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('auth_token')}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            resolve({
              success: true,
              data: res.data.data
            });
          } else {
            resolve({
              success: false,
              error: res.data.message || '获取漂流瓶列表失败'
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
  },

  /**
   * 获取漂流瓶统计
   */
  fetchBottleStats() {
    return new Promise((resolve) => {
      wx.request({
        url: `${getApp().globalData.apiBaseUrl}/bottle/stats`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('auth_token')}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            resolve({
              success: true,
              data: res.data.data
            });
          } else {
            resolve({
              success: false,
              error: res.data.message || '获取漂流瓶统计失败'
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
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  /**
   * 点击回复漂流瓶
   */
  onReplyBottle(e) {
    const bottle = e.currentTarget.dataset.bottle;
    if (!bottle) return;

    // 检查漂流瓶是否已回复
    if (bottle.isReplied) {
      this.showToast('该漂流瓶已收到回复');
      return;
    }

    this.setData({
      selectedBottle: bottle,
      showReplyModal: true,
      replyContent: ''
    });
  },

  /**
   * 关闭回复弹窗
   */
  closeReplyModal() {
    this.setData({
      showReplyModal: false,
      selectedBottle: null,
      replyContent: ''
    });
  },

  /**
   * 回复内容输入
   */
  onReplyInput(e) {
    this.setData({
      replyContent: e.detail.value
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
      // 显示加载
      wx.showLoading({
        title: '发送中...',
        mask: true
      });

      // 发送回复到后端
      wx.request({
        url: `${getApp().globalData.apiBaseUrl}/bottle/${this.data.selectedBottle.id}/reply`,
        method: 'POST',
        data: {
          content
        },
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('auth_token')}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            this.showToast('回复发送成功');
            this.closeReplyModal();
            
            // 重新加载数据
            this.loadBottleData();

            // WebSocket通知如果有连接
            if (this.socket && res.data.data) {
              this.socket.send({
                data: JSON.stringify({
                  type: 'bottle:reply_notify',
                  bottleId: this.data.selectedBottle.id,
                  replyContent: content,
                  originalSenderId: this.data.selectedBottle.userId
                })
              });
            }
          } else {
            this.showToast(res.data.message || '回复发送失败');
          }
        },
        fail: (err) => {
          this.showToast('网络请求失败');
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    } catch (error) {
      console.error('发送回复失败:', error);
      this.showToast('发送失败');
      wx.hideLoading();
    }
  },

  /**
   * 点击点赞漂流瓶
   */
  async onLikeBottle(e) {
    const bottle = e.currentTarget.dataset.bottle;
    if (!bottle) return;

    try {
      wx.request({
        url: `${getApp().globalData.apiBaseUrl}/bottle/${bottle.id}/like`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('auth_token')}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            this.showToast('点赞成功');
            
            // 重新加载数据
            this.loadBottleData();
          } else {
            this.showToast(res.data.message || '点赞失败');
          }
        },
        fail: (err) => {
          this.showToast('网络请求失败');
        }
      });
    } catch (error) {
      console.error('点赞失败:', error);
      this.showToast('点赞失败');
    }
  },

  /**
   * 捞取新的漂流瓶
   */
  onPickBottle() {
    wx.showLoading({
      title: '正在捞取...',
      mask: true
    });

    wx.request({
      url: `${getApp().globalData.apiBaseUrl}/bottle/pick`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('auth_token')}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          wx.hideLoading();
          
          // 关闭当前页面回到上级页面，并显示回复弹窗
          const bottleData = res.data.data;
          
          wx.redirectTo({
            url: `/pages/bottle/reply?bottleId=${bottleData.bottleId}&content=${encodeURIComponent(bottleData.content)}&question=${encodeURIComponent(bottleData.question || '')}&hasQuestion=${bottleData.hasQuestion}`
          });
        } else {
          wx.hideLoading();
          this.showToast(res.data.message || '捞取失败');
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.showToast('网络请求失败');
      }
    });
  },

  /**
   * 扔出漂流瓶
   */
  onThrowBottle() {
    wx.navigateTo({
      url: '/pages/bottle/throw'
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
   * 复制漂流瓶内容
   */
  copyBottleContent(e) {
    const content = e.currentTarget.dataset.content;
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
   * 页面下拉刷新
   */
  onPullDownRefresh() {
    this.loadBottleData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '漂流瓶 - 发现有趣的灵魂',
      path: '/pages/bottle/list',
      imageUrl: '/assets/images/bottle-share.png'
    };
  },

  /**
   * 格式化时间
   */
  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // 今天内
    if (diff < 24 * 60 * 60 * 1000 && 
        date.toDateString() === now.toDateString()) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // 昨天
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    
    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
      return weekDay;
    }
    
    // 更早
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
});
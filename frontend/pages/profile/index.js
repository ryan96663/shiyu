// 个人中心页面逻辑
Page({
  /**
   * 页面数据
   */
  data: {
    userInfo: {
      id: '',
      displayName: '',
      avatar: '',
      area: '未知地区',
      joinDate: '',
      stats: {
        reviews: 0,
        receivedReviews: 0,
        averageRating: 0,
        bottlesThrown: 0,
        bottlesPicked: 0,
        totalLikes: 0,
        groupsJoined: 0,
        friendsCount: 0
      }
    },
    tabIndex: 0, // 当前标签页：0-我的评价 1-收到的评价
    myReviews: [],
    receivedReviews: [],
    loading: true,
    showToast: false,
    toastMessage: ''
  },

  /**
   * 页面生命周期：加载
   */
  onLoad() {
    this.loadUserData();
  },

  /**
   * 页面生命周期：显示
   */
  onShow() {
    // 页面重新显示时刷新数据
    if (this.data.userInfo.id) {
      this.loadUserData();
    }
  },

  /**
   * 加载用户数据
   */
  async loadUserData() {
    try {
      this.setData({ loading: true });

      const token = wx.getStorageSync('auth_token');
      if (!token) {
        this.redirectToLogin();
        return;
      }

      // 并发加载用户信息、评价数据等
      await Promise.all([
        this.loadUserInfo(),
        this.loadUserStats(),
        this.loadMyReviews(),
        this.loadReceivedReviews()
      ]);

      console.log('用户数据加载完成');
    } catch (error) {
      console.error('加载用户数据失败:', error);
      this.showToast('数据加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载用户基本信息
   */
  async loadUserInfo() {
    try {
      // 从本地存储获取用户信息
      const userInfo = wx.getStorageSync('user_info');
      if (userInfo) {
        const formattedUserInfo = {
          ...userInfo,
          joinDate: userInfo.joinDate || new Date().toISOString()
        };
        this.setData({ userInfo: formattedUserInfo });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  /**
   * 从后端获取用户统计
   */
  async loadUserStats() {
    try {
      const token = wx.getStorageSync('auth_token');
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${getApp().globalData.apiBaseUrl}/user/stats`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data.success) {
        this.setData({
          'userInfo.stats': response.data.data
        });
      }
    } catch (error) {
      console.error('加载用户统计失败:', error);
      // 使用默认统计值
      this.setData({
        'userInfo.stats': {
          reviews: 0,
          receivedReviews: 0,
          averageRating: 0,
          bottlesThrown: 0,
          bottlesPicked: 0,
          totalLikes: 0,
          groupsJoined: 0,
          friendsCount: 0
        }
      });
    }
  },

  /**
   * 加载我的评价
   */
  async loadMyReviews() {
    try {
      const token = wx.getStorageSync('auth_token');
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${getApp().globalData.apiBaseUrl}/user/reviews`,
          method: 'GET',
          data: {
            page: 1,
            limit: 20
          },
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data.success) {
        this.setData({
          myReviews: response.data.data.reviews || []
        });
      }
    } catch (error) {
      console.error('加载我的评价失败:', error);
    }
  },

  /**
   * 加载收到的评价
   */
  async loadReceivedReviews() {
    try {
      const userId = this.data.userInfo.id;
      if (!userId) {
        this.setData({ receivedReviews: [] });
        return;
      }

      const token = wx.getStorageSync('auth_token');
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${getApp().globalData.apiBaseUrl}/review/user/${userId}`,
          method: 'GET',
          data: {
            page: 1,
            limit: 20
          },
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data.success) {
        this.setData({
          receivedReviews: response.data.data.reviews || []
        });
      }
    } catch (error) {
      console.error('加载收到的评价失败:', error);
      this.setData({ receivedReviews: [] });
    }
  },

  /**
   * 切换到我的评价
   */
  switchToMyReviews() {
    this.setData({ tabIndex: 0 });
  },

  /**
   * 切换到收到的评价
   */
  switchToReceivedReviews() {
    this.setData({ tabIndex: 1 });
  },

  /**
   * 编辑个人信息
   */
  onEditProfile() {
    wx.navigateTo({
      url: '/pages/profile/edit'
    });
  },

  /**
   * 查看评价详情（目前只做简单展示）
   */
  onReviewTap(e) {
    const review = e.currentTarget.dataset.review;
    console.log('查看评价详情:', review);
    // 可以扩展到评价详情页面
  },

  /**
   * 删除自己的评价
   */
  onDeleteReview(e) {
    const reviewId = e.currentTarget.dataset.reviewId;
    if (!reviewId) return;

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条评价吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteReview(reviewId);
        }
      }
    });
  },

  /**
   * 删除评价
   */
  async deleteReview(reviewId) {
    try {
      const token = wx.getStorageSync('auth_token');
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${getApp().globalData.apiBaseUrl}/review/${reviewId}`,
          method: 'DELETE',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data.success) {
        this.showToast('评价删除成功');
        // 重新加载评价数据
        this.loadMyReviews();
        this.loadUserStats();
      } else {
        this.showToast(response.data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除评价失败:', error);
      this.showToast('删除失败');
    }
  },

  /**
   * 更新用户信息（用于跳转到编辑页后返回时的刷新）
   */
  onReturnFromEditPage() {
    // 从编辑页返回时重新加载用户信息
    this.loadUserData();
  },

  /**
   * 跳转到编辑页面
   */
  navigateToEdit() {
    wx.navigateTo({
      url: '/pages/profile/edit',
      events: {
        // 监听返回事件
        returnFromEdit: this.onReturnFromEditPage
      }
    });
  },

  /**
   * 复制用户ID
   */
  copyUserId() {
    const userId = this.data.userInfo.id;
    if (!userId) {
      this.showToast('用户ID不存在');
      return;
    }

    wx.setClipboardData({
      data: userId,
      success: () => {
        this.showToast('用户ID已复制');
      },
      fail: () => {
        this.showToast('复制失败');
      }
    });
  },

  /**
   * 跳转到漂流瓶页面
   */
  goToBottleList() {
    wx.navigateTo({
      url: '/pages/bottle/list'
    });
  },

  /**
   * 跳转到群组历史
   */
  goToGroupHistory() {
    this.showToast('功能开发中');
  },

  /**
   * 跳转到意见反馈
   */
  goToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/index'
    });
  },

  /**
   * 登出
   */
  onLogout() {
    wx.showModal({
      title: '确认登出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          this.performLogout();
        }
      }
    });
  },

  /**
   * 执行登出操作
   */
  performLogout() {
    try {
      // 清除本地数据
      wx.removeStorageSync('auth_token');
      wx.removeStorageSync('user_info');
      
      // 清除全局数据
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.isLoggedIn = false;
        app.globalData.userInfo = null;
      }

      this.showToast('已退出登录');

      // 延迟跳转到登录页
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/login/index'
        });
      }, 1500);
    } catch (error) {
      console.error('登出失败:', error);
      this.showToast('登出失败');
    }
  },

  /**
   * 重定向到登录页
   */
  redirectToLogin() {
    wx.reLaunch({
      url: '/pages/login/index'
    });
  },

  /**
   * 显示提示信息
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
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadUserData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: `${this.data.userInfo.displayName || '我'}的美食社交主页`,
      path: '/pages/profile/index',
      imageUrl: '/assets/images/profile-share.png'
    };
  },

  /**
   * 格式化时间函数
   */
  formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}年${month}月`;
  },

  /**
   * 跳转到排行榜
   */
  goToRankings() {
    wx.navigateTo({
      url: '/pages/rankings/index'
    });
  },

  /**
   * 评分显示组件
   */
  renderStars(rating) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('★'); // 全星
      } else if (i === fullStars && hasHalfStar) {
        stars.push('☆'); // 半星(用空心星表示)
      } else {
        stars.push('☆'); // 空星
      }
    }
    
    return stars.join('');
  }
});
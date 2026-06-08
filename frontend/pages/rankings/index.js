// 排行榜页面逻辑
Page({
  /**
   * 页面数据
   */
  data: {
    activeTab: 'people', // people: 人气榜, stores: 店铺榜
    activePeriod: 'weekly', // daily, weekly, monthly, all
    peopleRankings: [],
    storeRankings: [],
    loading: true,
    showToast: false,
    toastMessage: ''
  },

  /**
   * 页面生命周期：加载
   */
  onLoad() {
    this.loadRankings();
  },

  /**
   * 加载排行榜数据
   */
  async loadRankings() {
    try {
      this.setData({ loading: true });

      const token = wx.getStorageSync('auth_token');
      if (!token) {
        this.showToast('请先登录');
        wx.navigateTo({ url: '/pages/login/index' });
        return;
      }

      // 并行加载两个排行榜的数据
      const [peopleResult, storeResult] = await Promise.all([
        this.fetchPeopleRankings(),
        this.fetchStoreRankings()
      ]);

      if (peopleResult.success) {
        this.setData({ peopleRankings: peopleResult.data || [] });
      }

      if (storeResult.success) {
        this.setData({ storeRankings: storeResult.data || [] });
      }

    } catch (error) {
      console.error('加载排行榜失败:', error);
      this.showToast('数据加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 获取人气榜数据
   */
  fetchPeopleRankings() {
    return new Promise((resolve) => {
      wx.request({
        url: `${getApp().globalData.apiBaseUrl}/review/rankings/users',
        method: 'GET',
        data: {
          period: this.data.activePeriod,
          limit: 50
        },
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('auth_token')}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            resolve({ success: true, data: res.data.data.rankings });
          } else {
            resolve({ success: false, error: res.data.message });
          }
        },
        fail: (err) => {
          resolve({ success: false, error: err.errMsg });
        }
      });
    });
  },

  /**
   * 获取店铺榜数据
   */
  fetchStoreRankings() {
    return new Promise((resolve) => {
      wx.request({
        url: `${getApp().globalData.apiBaseUrl}/review/rankings/stores',
        method: 'GET',
        data: {
          period: this.data.activePeriod,
          limit: 50
        },
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('auth_token')}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            resolve({ success: true, data: res.data.data.rankings });
          } else {
            resolve({ success: false, error: res.data.message });
          }
        },
        fail: (err) => {
          resolve({ success: false, error: err.errMsg });
        }
      });
    });
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    
    this.setData({ activeTab: tab });
  },

  /**
   * 切换时间周期
   */
  switchPeriod(e) {
    const period = e.currentTarget.dataset.period;
    if (period === this.data.activePeriod) return;
    
    this.setData({ activePeriod: period });
    
    // 根据新的周期重新加载数据
    setTimeout(() => {
      this.loadRankings();
    }, 100);
  },

  /**
   * 查看用户详情
   */
  onUserTap(e) {
    const userId = e.currentTarget.dataset.userId;
    if (!userId) return;
    
    // 跳转到用户评价页面或个人资料
    wx.showToast({
      title: '查看用户详情功能开发中',
      icon: 'none'
    });
  },

  /**
   * 查看店铺详情
   */
  onStoreTap(e) {
    const storeId = e.currentTarget.dataset.storeId;
    if (!storeId) return;
    
    // 跳转到店铺详情页
    wx.navigateTo({
      url: `/pages/store/detail?storeId=${storeId}`
    });
  },

  /**
   * 格式化排名变化
   */
  formatRankChange(change) {
    if (change > 0) {
      return `↑${change}`;
    } else if (change < 0) {
      return `↓${Math.abs(change)}`;
    }
    return '—';
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
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadRankings().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: `${this.data.activePeriod === 'weekly' ? '本周' : '今日'}排行榜 - 发现人气王店`,
      path: `/pages/rankings/index?period=${this.data.activePeriod}`,
      imageUrl: '/assets/images/rankings-share.png'
    };
  },

  /**
   * 格式化时间周期显示
   */
  formatPeriod(period) {
    const periodMap = {
      daily: '日榜',
      weekly: '周榜',
      monthly: '月榜',
      all: '总榜'
    };
    return periodMap[period] || '总榜';
  }
});
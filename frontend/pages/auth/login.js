// 登录页面逻辑

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false,
    showError: false,
    errorMessage: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查是否已登录
    this.checkLoginStatus();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 这里可以添加页面渲染完成后的初始化逻辑
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时的处理
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏时的处理
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 页面卸载时的处理
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const token = wx.getStorageSync('token');
      
      if (userInfo && token) {
        // 已登录，跳转到首页（用 reLaunch 而非 switchTab，因为 index 不在 tabBar 中）
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
  },

  /**
   * 微信一键登录
   */
  async onWechatLogin() {
    if (this.data.loading) {
      return;
    }
    
    this.setData({ loading: true });
    
    try {
      // 调用微信登录API
      const loginResult = await wx.login();
      
      if (!loginResult.code) {
        throw new Error('微信登录失败，请重试');
      }
      
      // 调用后端登录接口
      const response = await this.callLoginAPI(loginResult.code);
      
      if (response && response.success) {
        // 登录成功
        wx.setStorageSync('token', response.data.token);
        wx.setStorageSync('auth_token', response.data.token);
        wx.setStorageSync('userInfo', response.data.user);
        wx.setStorageSync('user_info', response.data.user);
        wx.setStorageSync('refreshToken', response.data.refreshToken);

        const app = getApp();
        app.globalData.token = response.data.token;
        app.globalData.userInfo = response.data.user;
        app.globalData.isLoggedIn = true;

        wx.showToast({ title: '登录成功', icon: 'success', duration: 1000 });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/index/index' });
        }, 1200);
      } else {
        throw new Error((response && response.message) || '登录失败');
      }
    } catch (error) {
      console.error('后端登录失败，使用Mock登录兜底:', error.message);
      // 后端不可用时自动使用Mock登录
      await this.mockLogin();
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 调用后端登录API
   */
  async callLoginAPI(wechatCode) {
    try {
      return new Promise((resolve, reject) => {
        wx.request({
          url: `${getApp().globalData.apiBaseUrl}/auth/login`,
          method: 'POST',
          data: {
            code: wechatCode,
            platform: 'wechat',
            version: '1.0.0'
          },
          header: {
            'Content-Type': 'application/json'
          },
          timeout: 5000,
          success: (res) => {
            if (res.statusCode === 200 && res.data && res.data.success) {
              resolve(res.data);
            } else {
              reject(new Error(res.data?.message || `服务端错误: ${res.statusCode}`));
            }
          },
          fail: (error) => {
            reject(new Error('网络请求失败，请检查网络连接'));
          }
        });
      });
    } catch (error) {
      console.error('调用登录API失败:', error);
      throw error;
    }
  },

  /**
   * Mock登录（后端不可用时兜底）
   */
  async mockLogin() {
    const mockUser = {
      id: '1001',
      nickname: '食客小王',
      avatar: '',
      role: 'customer',
      preferences: { anonymousDefault: false, notifications: true }
    };
    const mockToken = 'mock_token_' + Date.now();

    wx.setStorageSync('token', mockToken);
    wx.setStorageSync('auth_token', mockToken);
    wx.setStorageSync('userInfo', mockUser);
    wx.setStorageSync('user_info', mockUser);

    const app = getApp();
    app.globalData.token = mockToken;
    app.globalData.userInfo = mockUser;
    app.globalData.isLoggedIn = true;

    wx.showToast({ title: '离线模式已登录', icon: 'success', duration: 1000 });
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/index/index' });
    }, 800);
  },

  /**
   * 显示错误信息
   */
  showError(message) {
    this.setData({
      showError: true,
      errorMessage: message
    });
    
    // 3秒后自动隐藏错误提示
    setTimeout(() => {
      this.setData({
        showError: false,
        errorMessage: ''
      });
    }, 3000);
  },

  /**
   * 隐私政策页面跳转
   */
  navigateToPrivacy() {
    wx.navigateTo({
      url: '/pages/auth/privacy-policy'
    });
  },

  /**
   * 服务条款页面跳转
   */
  navigateToTerms() {
    wx.navigateTo({
      url: '/pages/auth/terms-of-service'
    });
  }
});
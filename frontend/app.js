/**
 * 美食社交小程序 - 应用入口
 * @author Foodie Social Team
 */

// 导入工具库
const { formatTime } = require('./utils/util');

App({
  globalData: {
    // 用户信息
    userInfo: null,
    token: null,
    
    // 应用状态
    isLoggedIn: false,
    currentStore: null,
    currentGroup: null,
    
    // 网络配置
    apiBaseUrl: 'http://localhost:3000/api/v1',
    socketUrl: 'ws://localhost:3000',
    
    // WebSocket连接
    socketTask: null,
    
    // 缓存数据
    cache: {
      stores: {},
      groups: {},
      bottles: {},
      scenes: {}
    },
    
    // 设备信息
    systemInfo: wx.getSystemInfoSync()
  },
  
  onLaunch(options) {
    console.log('App Launch', options);
    
    // 初始化应用
    this.initApp();
    
    // 检查更新
    this.checkUpdate();
  },
  
  onShow(options) {
    console.log('App Show', options);
  },
  
  onHide() {
    console.log('App Hide');
  },
  
  onError(error) {
    console.error('App Error:', error);
  },
  
  // 应用初始化
  initApp() {
    // 获取系统信息
    this.globalData.systemInfo = wx.getSystemInfoSync();
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 初始化缓存
    this.initCache();
  },
  
  // 检查登录状态
  checkLoginStatus() {
    try {
      const token = wx.getStorageSync('token') || wx.getStorageSync('auth_token');
      const userInfo = wx.getStorageSync('userInfo') || wx.getStorageSync('user_info');

      if (token && userInfo) {
        this.globalData.token = token;
        this.globalData.userInfo = userInfo;
        this.globalData.isLoggedIn = true;
      } else {
        this.globalData.isLoggedIn = false;
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      this.globalData.isLoggedIn = false;
    }
  },
  
  // 初始化缓存
  initCache() {
    try {
      const cacheData = wx.getStorageSync('appCache');
      if (cacheData) {
        this.globalData.cache = { ...this.globalData.cache, ...cacheData };
      }
    } catch (error) {
      console.error('初始化缓存失败:', error);
    }
  },
  
  // 保存缓存
  saveCache() {
    try {
      wx.setStorageSync('appCache', this.globalData.cache);
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  },
  
  // 用户登录
  async login(code) {
    try {
      const res = await this.request('/auth/login', {
        method: 'POST',
        data: { code }
      });
      
      if (res.code === 200) {
        const { token, user } = res.data;
        
        // 保存登录信息
        this.globalData.token = token;
        this.globalData.userInfo = user;
        this.globalData.isLoggedIn = true;
        
        wx.setStorageSync('token', token);
        wx.setStorageSync('userInfo', user);
        
        // 连接WebSocket
        this.connectWebSocket();
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        return true;
      } else {
        wx.showToast({
          title: res.message || '登录失败',
          icon: 'error'
        });
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'error'
      });
      return false;
    }
  },
  
  // 退出登录
  logout() {
    // 断开WebSocket
    this.disconnectWebSocket();
    
    // 清除用户数据
    this.globalData.userInfo = null;
    this.globalData.token = null;
    this.globalData.isLoggedIn = false;
    this.globalData.currentStore = null;
    this.globalData.currentGroup = null;
    
    // 清除缓存
    try {
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
    
    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/auth/login'
    });
  },
  
  // 网络请求封装
  request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        method = 'GET',
        data = null,
        header = {},
        dataType = 'json',
        responseType = 'text'
      } = options;
      
      // 添加认证头
      const authHeader = {};
      if (this.globalData.token) {
        authHeader['Authorization'] = `Bearer ${this.globalData.token}`;
      }
      
      wx.request({
        url: this.globalData.apiBaseUrl + url,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          ...authHeader,
          ...header
        },
        dataType,
        responseType,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // 认证失败，退出登录
            this.logout();
            reject(new Error('认证失败'));
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: (error) => {
          console.error('请求失败:', error);
          reject(error);
        }
      });
    });
  },
  
  // WebSocket连接
  connectWebSocket() {
    if (!this.globalData.isLoggedIn || this.globalData.socketTask) {
      return;
    }
    
    this.globalData.socketTask = wx.connectSocket({
      url: this.globalData.socketUrl,
      header: {
        'Authorization': `Bearer ${this.globalData.token}`
      },
      success: () => {
        console.log('WebSocket连接成功');
      },
      fail: (error) => {
        console.error('WebSocket连接失败:', error);
      }
    });
    
    // 监听WebSocket事件
    this.globalData.socketTask.onOpen(() => {
      console.log('WebSocket已连接');
      
      // 发送认证消息
      this.globalData.socketTask.send({
        data: JSON.stringify({
          type: 'auth',
          token: this.globalData.token
        })
      });
    });
    
    this.globalData.socketTask.onClose(() => {
      console.log('WebSocket已断开');
      this.globalData.socketTask = null;
    });
    
    this.globalData.socketTask.onError((error) => {
      console.error('WebSocket错误:', error);
    });
    
    this.globalData.socketTask.onMessage((message) => {
      try {
        const data = JSON.parse(message.data);
        this.handleSocketMessage(data);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    });
  },
  
  // 断开WebSocket
  disconnectWebSocket() {
    if (this.globalData.socketTask) {
      this.globalData.socketTask.close({
        success: () => {
          console.log('WebSocket已断开');
        }
      });
      this.globalData.socketTask = null;
    }
  },
  
  // 处理WebSocket消息
  handleSocketMessage(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'message:new':
        // 新消息通知
        this.emit('newMessage', payload);
        break;
      case 'user:online':
        // 用户上线
        this.emit('userOnline', payload);
        break;
      case 'user:offline':
        // 用户下线
        this.emit('userOffline', payload);
        break;
      case 'bottle:new':
        // 新漂流瓶
        this.emit('newBottle', payload);
        break;
      case 'bottle:responded':
        // 漂流瓶回复
        this.emit('bottleResponded', payload);
        break;
      default:
        console.log('未知消息类型:', type, payload);
    }
  },
  
  // 发送WebSocket消息
  sendSocketMessage(type, payload) {
    if (!this.globalData.socketTask) {
      console.error('WebSocket未连接');
      return;
    }
    
    this.globalData.socketTask.send({
      data: JSON.stringify({ type, payload })
    });
  },
  
  // 事件监听系统
  listeners: {},
  
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  
  off(event, callback) {
    if (!this.listeners[event]) return;
    
    if (callback) {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    } else {
      this.listeners[event] = [];
    }
  },
  
  emit(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('事件回调执行错误:', error);
      }
    });
  },
  
  // 获取位置信息
  getLocation() {
    return new Promise((resolve) => {
      wx.getLocation({
        type: 'wgs84',
        success: (res) => {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude,
            accuracy: res.accuracy
          });
        },
        fail: () => {
          // 模拟器/无权限时使用默认位置（北京国贸）
          resolve({
            latitude: 39.9042,
            longitude: 116.4074,
            accuracy: 30
          });
        }
      });
    });
  },
  
  // 获取WiFi信息
  getWifiInfo() {
    return new Promise((resolve, reject) => {
      wx.getConnectedWifi({
        success: (res) => {
          const wifi = res.wifi;
          resolve({
            ssid: wifi.SSID,
            bssid: wifi.BSSID,
            signalStrength: wifi.signalStrength
          });
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },
  
  // 检查更新
  checkUpdate() {
    const updateManager = wx.getUpdateManager();
    
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        console.log('有新版本');
      }
    });
    
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        }
      });
    });
    
    updateManager.onUpdateFailed(() => {
      wx.showToast({
        title: '更新失败，请检查网络',
        icon: 'error'
      });
    });
  }
});
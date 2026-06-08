/**
 * 首页 - 店铺发现和搜索
 * @author Foodie Social Team
 */

const app = getApp();

// 店铺图片映射
const { resolveStoreImages } = require('../../config/store-image-map.js');

// 本地 Mock 店铺数据（30 条），后端返回空时兜底
const ALL_MOCK_STORES = [
  { store_id: 'mock_001', name: '蜀大侠川味火锅', address: '朝阳区三里屯太古里B1', distance: 180, rating: 4.7, tags: ['火锅', '川菜', '麻辣'], average_price: 98, image_url: '' },
  { store_id: 'mock_002', name: '海底捞火锅', address: '朝阳区建国路88号', distance: 350, rating: 4.6, tags: ['火锅', '服务好', '24小时'], average_price: 120, image_url: '' },
  { store_id: 'mock_003', name: '潮汕牛肉火锅', address: '海淀区中关村大街1号', distance: 520, rating: 4.5, tags: ['火锅', '潮汕', '牛肉'], average_price: 85, image_url: '' },
  { store_id: 'mock_004', name: '老北京铜锅涮肉', address: '东城区王府井大街', distance: 600, rating: 4.4, tags: ['火锅', '老北京', '羊肉'], average_price: 75, image_url: '' },
  { store_id: 'mock_005', name: '渝味火锅', address: '朝阳区望京SOHO', distance: 800, rating: 4.3, tags: ['火锅', '重庆', '毛肚'], average_price: 90, image_url: '' },
  { store_id: 'mock_006', name: '杨国福麻辣烫', address: '海淀区五道口', distance: 250, rating: 4.2, tags: ['麻辣烫', '快餐', '实惠'], average_price: 30, image_url: '' },
  { store_id: 'mock_007', name: '张亮麻辣烫', address: '朝阳区双井街道', distance: 420, rating: 4.1, tags: ['麻辣烫', '快餐', '自选'], average_price: 28, image_url: '' },
  { store_id: 'mock_008', name: '西贝莜面村', address: '朝阳区大悦城6F', distance: 320, rating: 4.5, tags: ['西北菜', '面食', '羊肉'], average_price: 80, image_url: '' },
  { store_id: 'mock_009', name: '眉州东坡酒楼', address: '海淀区中关村东路', distance: 480, rating: 4.4, tags: ['川菜', '家常菜', '宫保鸡丁'], average_price: 65, image_url: '' },
  { store_id: 'mock_010', name: '大董烤鸭店', address: '东城区东四十条', distance: 700, rating: 4.8, tags: ['烤鸭', '京菜', '高端'], average_price: 280, image_url: '' },
  { store_id: 'mock_011', name: '全聚德烤鸭', address: '东城区前门大街', distance: 750, rating: 4.3, tags: ['烤鸭', '老字号', '京菜'], average_price: 180, image_url: '' },
  { store_id: 'mock_012', name: '鼎泰丰小笼包', address: '朝阳区国贸商城', distance: 380, rating: 4.6, tags: ['小笼包', '台湾菜', '精致'], average_price: 110, image_url: '' },
  { store_id: 'mock_013', name: '兰州拉面', address: '海淀区学院路', distance: 150, rating: 4.0, tags: ['面馆', '清真', '快餐'], average_price: 20, image_url: '' },
  { store_id: 'mock_014', name: '味千拉面', address: '朝阳区朝阳大悦城B1', distance: 310, rating: 4.0, tags: ['日式', '拉面', '快餐'], average_price: 45, image_url: '' },
  { store_id: 'mock_015', name: '元气寿司', address: '海淀区中关村欧美汇', distance: 500, rating: 4.2, tags: ['日料', '寿司', '回转'], average_price: 88, image_url: '' },
  { store_id: 'mock_016', name: '将太无二', address: '朝阳区蓝色港湾', distance: 650, rating: 4.4, tags: ['日料', '创意寿司', '刺身'], average_price: 150, image_url: '' },
  { store_id: 'mock_017', name: '韩式烤肉名家', address: '朝阳区望京韩国城', distance: 850, rating: 4.3, tags: ['韩餐', '烤肉', '泡菜'], average_price: 95, image_url: '' },
  { store_id: 'mock_018', name: '木屋烧烤', address: '海淀区五道口', distance: 260, rating: 4.2, tags: ['烧烤', '夜宵', '啤酒'], average_price: 70, image_url: '' },
  { store_id: 'mock_019', name: '很久以前羊肉串', address: '朝阳区工体北路', distance: 550, rating: 4.4, tags: ['烧烤', '羊肉串', '内蒙'], average_price: 80, image_url: '' },
  { store_id: 'mock_020', name: '费大厨辣椒炒肉', address: '海淀区中关村', distance: 470, rating: 4.5, tags: ['湘菜', '辣椒炒肉', '下饭'], average_price: 55, image_url: '' },
  { store_id: 'mock_021', name: '太二酸菜鱼', address: '朝阳区合生汇', distance: 400, rating: 4.6, tags: ['川菜', '酸菜鱼', '网红'], average_price: 75, image_url: '' },
  { store_id: 'mock_022', name: '外婆家', address: '海淀区华联商厦', distance: 380, rating: 4.3, tags: ['江浙菜', '家常菜', '实惠'], average_price: 55, image_url: '' },
  { store_id: 'mock_023', name: '绿茶餐厅', address: '朝阳区长楹天街', distance: 720, rating: 4.1, tags: ['江浙菜', '融合菜', '环境好'], average_price: 60, image_url: '' },
  { store_id: 'mock_024', name: '云海肴云南菜', address: '海淀区五道口购物中心', distance: 280, rating: 4.3, tags: ['云南菜', '米线', '汽锅鸡'], average_price: 70, image_url: '' },
  { store_id: 'mock_025', name: '避风塘', address: '朝阳区SKP', distance: 580, rating: 4.2, tags: ['粤菜', '港式', '茶餐厅'], average_price: 65, image_url: '' },
  { store_id: 'mock_026', name: '点都德', address: '朝阳区三里屯', distance: 200, rating: 4.5, tags: ['粤菜', '早茶', '点心'], average_price: 90, image_url: '' },
  { store_id: 'mock_027', name: '胡大饭馆', address: '东城区簋街', distance: 680, rating: 4.6, tags: ['小龙虾', '川菜', '夜宵'], average_price: 130, image_url: '' },
  { store_id: 'mock_028', name: '萨莉亚意式餐厅', address: '海淀区新中关', distance: 490, rating: 3.9, tags: ['西餐', '意大利', '平价'], average_price: 35, image_url: '' },
  { store_id: 'mock_029', name: '必胜客', address: '朝阳区望京凯德MALL', distance: 820, rating: 3.8, tags: ['披萨', '西餐', '快餐'], average_price: 70, image_url: '' },
  { store_id: 'mock_030', name: '星巴克甄选', address: '朝阳区国贸三期', distance: 370, rating: 4.3, tags: ['咖啡', '下午茶', '休闲'], average_price: 40, image_url: '' }
];

Page({
  data: {
    // 搜索相关
    searchKeyword: '',
    searchHistory: [],
    
    // 位置相关
    currentLocation: null,
    selectedCity: '北京',
    
    // 店铺数据
    nearbyStores: [],
    hotStores: [],
    recentStores: [],
    
    // 界面状态
    isLoading: false,
    showSearchHistory: false,
    
    // 推荐标签
    categories: [
      { id: 1, name: '火锅', icon: '/images/category/hotpot.jpg' },
      { id: 2, name: '烧烤', icon: '/images/category/bbq.jpg' },
      { id: 3, name: '川菜', icon: '/images/category/sichuan.jpg' },
      { id: 4, name: '粤菜', icon: '/images/category/cantonese.jpg' },
      { id: 5, name: '日料', icon: '/images/category/sushi.jpg' },
      { id: 6, name: '西餐', icon: '/images/category/western.jpg' },
      { id: 7, name: '甜品', icon: '/images/category/dessert.jpg' },
      { id: 8, name: '咖啡', icon: '/images/category/coffee.jpg' }
    ]
  },
  
  onLoad(options) {
    console.log('首页加载', options);

    // 检查登录状态 — 兜底：storage 有 token 就认为已登录
    if (!app.globalData.isLoggedIn) {
      const token = wx.getStorageSync('token') || wx.getStorageSync('auth_token');
      if (token) {
        app.globalData.token = token;
        app.globalData.isLoggedIn = true;
      } else {
        wx.redirectTo({
          url: '/pages/auth/login'
        });
        return;
      }
    }

    // 初始化页面
    this.initPage();
  },
  
  onShow() {
    // 每次显示页面时刷新数据
    if (app.globalData.isLoggedIn) {
      this.loadNearbyStores();
    }
  },
  
  onPullDownRefresh() {
    // 下拉刷新
    this.refreshData();
  },
  
  onReachBottom() {
    // 加载更多店铺
    this.loadMoreStores();
  },
  
  // 页面初始化
  async initPage() {
    try {
      this.setData({ isLoading: true });
      
      // 获取当前位置
      await this.getCurrentLocation();
      
      // 加载附近店铺
      await this.loadNearbyStores();
      
      // 加载热门店铺
      await this.loadHotStores();
      
      // 加载搜索历史
      this.loadSearchHistory();
      
    } catch (error) {
      console.error('页面初始化失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },
  
  // 获取当前位置
  async getCurrentLocation() {
    try {
      const location = await app.getLocation();
      this.setData({
        currentLocation: location
      });
    } catch (error) {
      console.error('获取位置失败:', error);
      // 使用默认位置
      this.setData({
        currentLocation: {
          latitude: 39.9042,
          longitude: 116.4074
        }
      });
    }
  },
  
  // 加载附近店铺
  async loadNearbyStores() {
    try {
      const { currentLocation, searchKeyword } = this.data;

      const res = await app.request('/store/search', {
        method: 'GET',
        data: {
          longitude: currentLocation ? currentLocation.longitude : 116.4074,
          latitude: currentLocation ? currentLocation.latitude : 39.9042,
          radius: 5000, page: 1, limit: 20,
          keyword: searchKeyword || ''
        }
      });

      if (res && res.success && res.data && res.data.stores && res.data.stores.length > 0) {
        this.setData({ nearbyStores: resolveStoreImages(res.data.stores) });
      } else {
        // 后端返回空 → 兜底：搜索时本地过滤，否则显示全部
        const keyword = this.data.searchKeyword;
        const stores = keyword ? this.filterLocalStores(keyword) : this.getMockStores();
        this.setData({ nearbyStores: stores });
      }
    } catch (error) {
      // 请求失败 → 完全兜底
      const keyword = this.data.searchKeyword;
      const stores = keyword ? this.filterLocalStores(keyword) : this.getMockStores();
      this.setData({ nearbyStores: stores });
    }
  },
  
  // 加载热门店铺
  async loadHotStores() {
    try {
      const res = await app.request('/store/search', {
        method: 'GET',
        data: {
          sort_by: 'rating',
          limit: 6
        }
      });

      if (res && res.success && res.data && res.data.stores) {
        this.setData({
          hotStores: resolveStoreImages(res.data.stores || [])
        });
      } else {
        // 后端无数据 → 用 mock 前 6 条
        this.setData({ hotStores: resolveStoreImages(ALL_MOCK_STORES.slice(0, 6)) });
      }
    } catch (error) {
      console.error('加载热门店铺失败，使用Mock兜底:', error);
      this.setData({ hotStores: resolveStoreImages(ALL_MOCK_STORES.slice(0, 6)) });
    }
  },
  
  // 刷新数据
  async refreshData() {
    wx.showNavigationBarLoading();
    
    try {
      await Promise.all([
        this.loadNearbyStores(),
        this.loadHotStores()
      ]);
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      });
    } finally {
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
    }
  },
  
  // 加载更多店铺
  async loadMoreStores() {
    const { nearbyStores } = this.data;
    
    try {
      const res = await app.request('/store/search', {
        method: 'GET',
        data: {
          lng: this.data.currentLocation?.longitude,
          lat: this.data.currentLocation?.latitude,
          page: Math.floor(nearbyStores.length / 10) + 1,
          limit: 10
        }
      });
      
      if (res && res.success && res.data && res.data.stores) {
        const newStores = resolveStoreImages(res.data.stores || []);
        this.setData({
          nearbyStores: [...nearbyStores, ...newStores]
        });
      }
    } catch (error) {
      console.error('加载更多失败:', error);
    }
  },
  
  // 搜索处理
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({
      searchKeyword: keyword,
      showSearchHistory: keyword === ''
    });
    // 实时本地过滤
    if (keyword) {
      const filtered = this.filterLocalStores(keyword);
      this.setData({ nearbyStores: filtered });
    } else {
      this.setData({ nearbyStores: this.getMockStores() });
    }
  },

  onSearchFocus() { this.setData({ showSearchHistory: true }); },

  onSearchConfirm(e) {
    const keyword = e.detail.value.trim();
    if (keyword) {
      this.performSearch(keyword);
    }
  },

  async performSearch(keyword) {
    try {
      this.setData({ searchKeyword: keyword, showSearchHistory: false });

      // 添加到搜索历史
      this.addSearchHistory(keyword);

      // Demo：直接本地过滤，避免 API 超时阻塞 UI
      const filtered = this.filterLocalStores(keyword);
      this.setData({ nearbyStores: filtered });
    } catch (error) {
      wx.showToast({ title: '搜索失败', icon: 'error' });
    }
  },

  /** 搜索框失焦时收起搜索历史，恢复首页视图 */
  onSearchBlur() {
    // 延迟确保 onHistoryItemTap 等点击事件先触发
    setTimeout(() => {
      this.setData({ showSearchHistory: false });
    }, 200);
  },
  
  // 搜索历史管理
  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('searchHistory') || [];
      this.setData({
        searchHistory: history.slice(0, 10) // 最多10条
      });
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  },
  
  addSearchHistory(keyword) {
    try {
      let history = wx.getStorageSync('searchHistory') || [];
      
      // 移除重复项
      history = history.filter(item => item !== keyword);
      
      // 添加到开头
      history.unshift(keyword);
      
      // 限制数量
      history = history.slice(0, 10);
      
      wx.setStorageSync('searchHistory', history);
      
      this.setData({
        searchHistory: history
      });
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  },
  
  clearSearchHistory() {
    try {
      wx.removeStorageSync('searchHistory');
      this.setData({
        searchHistory: []
      });
      
      wx.showToast({
        title: '清除成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('清除搜索历史失败:', error);
    }
  },
  
  onHistoryItemTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchKeyword: keyword
    });
    this.performSearch(keyword);
  },
  
  // 店铺交互
  onStoreTap(e) {
    const storeId = e.currentTarget.dataset.storeId;
    const storeName = e.currentTarget.dataset.storeName || '';

    wx.navigateTo({
      url: `/pages/store/detail?store_id=${storeId}&storeName=${storeName}`
    });
  },
  
  onStoreFavorite(e) {
    const { storeId, isFavorite } = e.detail;
    
    // TODO: 实现收藏功能
    wx.showToast({
      title: isFavorite ? '已取消收藏' : '已收藏',
      icon: 'success'
    });
  },
  
  // 分类选择
  onCategoryTap(e) {
    const categoryId = e.currentTarget.dataset.id;
    const categoryName = e.currentTarget.dataset.name;
    
    wx.navigateTo({
      url: `/pages/search/result?category=${categoryId}&categoryName=${categoryName}`
    });
  },
  
  // 位置选择
  onLocationTap() {
    wx.chooseLocation({
      success: (res) => {
        console.log('选择位置:', res);
        
        this.setData({
          currentLocation: {
            latitude: res.latitude,
            longitude: res.longitude,
            name: res.name,
            address: res.address
          }
        });
        
        // 重新加载附近店铺
        this.loadNearbyStores();
      },
      fail: (error) => {
        console.error('选择位置失败:', error);
      }
    });
  },
  
  // 快速操作
  onScanCode() {
    wx.scanCode({
      success: (res) => {
        console.log('扫码结果:', res);
        
        // 解析扫码结果
        try {
          const result = JSON.parse(res.result);
          if (result.store_id) {
            wx.navigateTo({
              url: `/pages/store/detail?store_id=${result.store_id}`
            });
          }
        } catch (error) {
          wx.showToast({
            title: '扫码失败',
            icon: 'error'
          });
        }
      },
      fail: (error) => {
        console.error('扫码失败:', error);
      }
    });
  },
  
  onMyLocation() {
    wx.navigateTo({
      url: '/pages/profile/index'
    });
  },
  
  onMessages() {
    wx.navigateTo({
      url: '/pages/messages/index'
    });
  },
  
  // 本地 Mock 数据
  getMockStores() {
    return resolveStoreImages(ALL_MOCK_STORES);
  },

  // 本地过滤搜索（兜底用）
  filterLocalStores(keyword) {
    const kw = keyword.toLowerCase();
    const filtered = ALL_MOCK_STORES.filter(store => {
      return store.name.toLowerCase().includes(kw) ||
        store.address.includes(kw) ||
        store.tags.some(tag => tag.toLowerCase().includes(kw));
    });
    return resolveStoreImages(filtered);
  },
});
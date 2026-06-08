// 店铺详情页面逻辑 (v6.0: 一体化背景图 + 热区覆盖 + 对话气泡)

const { HOTSPOTS } = require('../../config/hotspots.js');
const { TABLE_HOTSPOT_MAP, GROUP_CHAT_SCRIPT, GREETING_SCRIPT, getStoreScript, bubbleText } = require('../../config/demo-script.js');

Page({
  data: {
    // 店铺信息
    storeInfo: {
      id: '',
      name: '',
      onlineCount: 0,
      tableCount: 0
    },
    isInsideStore: true,

    // 群聊 & 弹幕
    showChatPanel: false,
    chatInput: '',
    chatMessages: [],
    danmakuMessages: [],
    bottleCount: 0,
    showDanmaku: true,
    chatMembers: 0,
    lastMessageId: '',

    // 产品榜单
    productReviews: [],
    productRanking: [],
    rankingLastUpdate: null,
    showRankingPanel: false,

    // 主题选择器
    currentRestaurantType: 'sichuan',
    showThemeSelector: false,

    // Toast
    showToast: false,
    toastMessage: '',

    // ★ v6.0 热区 & 气泡
    hotspots: HOTSPOTS,
    activeBubbleId: null,
    activeBubbleText: '',
    bubbleMessages: [
      '这家招牌菜绝了！',
      '强烈推荐这个，每次来都点',
      '今天人好多啊',
      '味道一如既往的好',
      '第一次来，有推荐的吗？',
      '隔壁桌的看着也好吃',
      '服务态度真不错',
      '环境很舒适，适合聚餐',
      '份量很足，性价比高',
      '排队排了好久，但值得'
    ],

    // Demo 播放引擎：每个热区上的发言计数标签
    tableChatCounts: {},

    // 桌位发言历史面板
    showTablePanel: false,
    tablePanelLabel: '',
    tablePanelMessages: []
  },

  // ========== 生命周期 ==========

  onLoad(options) {
    const storeId = options.store_id || options.storeId || 'store_001';
    const storeName = options.storeName || options.name || '美味中餐厅';
    const onlineCount = parseInt(options.onlineCount) || Math.floor(Math.random() * 20) + 5;
    const tableCount = parseInt(options.tableCount) || 10;

    this.setData({
      storeInfo: {
        id: storeId,
        name: storeName,
        onlineCount: onlineCount,
        tableCount: tableCount
      }
    });

    // ★ v6.0 Demo 播放：自动播放群聊 + 打招呼场景
    this.startDemoPlayback();
  },

  onShow() {
    this.checkUserStatus();
    this.connectWebSocket();
  },

  onHide() {
    this.disconnectWebSocket();
  },

  onUnload() {
    this.stopDanmakuTimer();
    this.disconnectWebSocket();
    if (this._bubbleTimer) clearTimeout(this._bubbleTimer);
    // 清理所有 Demo 定时器
    if (this._demoTimers) {
      this._demoTimers.forEach(t => clearTimeout(t));
      this._demoTimers = null;
    }
  },

  // ========== v6.0 核心：热区点击 → 对话气泡 ==========

  onTableTap(e) {
    const { id, label } = e.currentTarget.dataset;

    // 前台点击：Demo 模式 Toast 提示
    if (id === 'counter') {
      wx.showToast({ title: 'Demo模式：点餐功能需对接美团小程序', icon: 'none', duration: 2000 });
      return;
    }

    // 桌位点击：随机选一条预制文案，弹出气泡
    const messages = this.data.bubbleMessages;
    const text = messages[Math.floor(Math.random() * messages.length)];

    if (this._bubbleTimer) clearTimeout(this._bubbleTimer);

    this.setData({ activeBubbleId: id, activeBubbleText: text });
    wx.showToast({ title: label, icon: 'none', duration: 1500 });

    this._bubbleTimer = setTimeout(() => {
      this.setData({ activeBubbleId: null, activeBubbleText: '' });
    }, 3000);
  },

  // ========== v6.0 Demo 播放引擎 ==========

  /**
   * 启动 Demo 场景播放
   *
   * 群聊消息按秒数偏移通过 setTimeout 逐个触发
   * 打招呼对话独立于群聊，通过 toast 展示
   */
  startDemoPlayback() {
    const storeName = this.data.storeInfo.name;
    const script = getStoreScript(storeName);
    if (!script || !script.groupChat) return; // 非 Demo 店铺，不播放脚本

    // 初始化：每个热区的发言计数清零
    const counts = {};
    this.data.hotspots.forEach(h => { counts[h.id] = 0; });
    this.setData({ tableChatCounts: counts });

    // 存储所有 setTimeout ID，供卸载时清理
    this._demoTimers = [];

    // 统一通过 playGroupMessage 播放群聊脚本
    script.groupChat.forEach(msg => {
      const timer = setTimeout(() => { this.playGroupMessage(msg); }, msg.sec * 1000);
      this._demoTimers.push(timer);
    });
  },

  /**
   * 播放一条群聊消息
   */
  playGroupMessage(msg) {
    const hotspotId = msg.hotspot;
    const bubbleMsg = bubbleText(msg.msg);

    // 1. 加入聊天面板
    const newMsg = {
      id: `demo_${msg.sec}_${msg.table}`,
      senderName: `${msg.table}号桌`,
      table: msg.table,        // 用于按桌号过滤历史发言
      hotspot: msg.hotspot,    // 用于计数标签点击时定位
      content: msg.msg,
      time: this.formatDemoTime(msg.sec)
    };
    const chatMessages = [...this.data.chatMessages, newMsg];
    if (chatMessages.length > 60) chatMessages.shift();

    // 2. 弹幕
    const danmaku = `${msg.table}号桌: ${bubbleMsg}`;
    this.addDanmakuMessage(danmaku);

    // 3. 热区气泡（3 秒展示）
    if (hotspotId) {
      if (this._bubbleTimer) clearTimeout(this._bubbleTimer);
      this.setData({ activeBubbleId: hotspotId, activeBubbleText: bubbleMsg });
      this._bubbleTimer = setTimeout(() => {
        this.setData({ activeBubbleId: null, activeBubbleText: '' });
      }, 3000);
    }

    // 4. 发言计数
    const counts = { ...this.data.tableChatCounts };
    if (hotspotId) {
      counts[hotspotId] = (counts[hotspotId] || 0) + 1;
    }

    // 5. 产品评价分析
    this.analyzeProductReview(msg.msg, `${msg.table}号桌`);

    // 一次性 setData
    this.setData({
      chatMessages,
      tableChatCounts: counts,
      lastMessageId: `msg-${newMsg.id}`
    });
  },

  /**
   * 播放一条打招呼对话（Toast 展示）
   */
  playGreetingMessage(msg) {
    const icon = msg.type === 'send' ? '📤' : '📥';
    const title = msg.type === 'send'
      ? `${msg.fromName} 向你打招呼`
      : `${msg.fromName} 回复`;
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2500
    });
    // 也加入弹幕和聊天面板
    const entry = `${icon} ${msg.fromName}: ${bubbleText(msg.msg)}`;
    this.addDanmakuMessage(entry);

    const newMsg = {
      id: `greet_${msg.sec}`,
      senderName: msg.fromName,
      content: msg.msg,
      time: this.formatDemoTime(msg.sec)
    };
    const chatMessages = [...this.data.chatMessages, newMsg];
    if (chatMessages.length > 60) chatMessages.shift();
    this.setData({ chatMessages });
  },

  /**
   * 格式化 Demo 相对时间为 mm:ss
   */
  formatDemoTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  // ========== 桌位历史发言面板 ==========

  /**
   * 点击发言计数标签 → 展示该桌历史发言
   */
  onCountBadgeTap(e) {
    const hotspotId = e.currentTarget.dataset.id;
    // 从聊天记录中筛选该热区对应桌号的消息
    const messages = this.data.chatMessages.filter(m => m.hotspot === hotspotId);
    if (messages.length === 0) return;

    // 取桌号标签
    const hotspot = this.data.hotspots.find(h => h.id === hotspotId);
    const label = hotspot ? hotspot.label : '桌';

    this.setData({
      showTablePanel: true,
      tablePanelLabel: label,
      tablePanelMessages: messages
    });
  },

  /** 关闭桌位发言面板 */
  closeTablePanel() {
    this.setData({ showTablePanel: false, tablePanelMessages: [] });
  },

  // ========== 用户状态 & WebSocket（保留）==========

  checkUserStatus() {
    const app = getApp();
    const isInside = app.globalData.isInsideStore !== undefined ? app.globalData.isInsideStore : true;
    this.setData({ isInsideStore: isInside });
  },

  connectWebSocket() {
    try {
      const token = wx.getStorageSync('auth_token');
      if (!token) return;

      this.socket = wx.connectSocket({
        url: 'ws://localhost:3000',
        header: { 'Authorization': `Bearer ${token}` }
      });

      this.socket.onOpen(() => {
        this.socket.send({
          data: JSON.stringify({
            type: 'set_user_id',
            userId: wx.getStorageSync('user_id')
          })
        });
      });

      this.socket.onMessage((msg) => {
        this.handleWebSocketMessage(msg.data);
      });

      this.socket.onError((error) => {
        console.error('WebSocket错误:', error);
      });

      this.socket.onClose(() => {
        console.log('WebSocket断开连接');
      });
    } catch (error) {
      console.error('WebSocket连接失败:', error);
    }
  },

  disconnectWebSocket() {
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        // WebSocket 可能从未成功连接（已知 P0：wx.connectSocket 与 Socket.io 不兼容）
      }
      this.socket = null;
    }
  },

  handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data);
      switch (message.type) {
        case 'user:online':  this.handleUserOnline(message.data); break;
        case 'user:offline': this.handleUserOffline(message.data); break;
        case 'message:new':  this.handleNewMessage(message.data); break;
        case 'greeting:received': this.handleGreetingReceived(message.data); break;
        case 'bottle:response':   this.handleBottleResponse(message.data); break;
      }
    } catch (error) {
      console.error('处理WebSocket消息失败:', error);
    }
  },

  handleUserOnline(data) {
    this.setData({ chatMembers: this.data.chatMembers + 1 });
    this.addDanmakuMessage(`${data.displayName}进入了餐厅`);
  },

  handleUserOffline(data) {
    if (this.data.chatMembers > 0) {
      this.setData({ chatMembers: this.data.chatMembers - 1 });
    }
    this.addDanmakuMessage(`${data.displayName}离开了餐厅`);
  },

  handleNewMessage(data) {
    const newMessage = {
      id: data.id,
      senderName: data.displayName,
      content: data.content,
      time: this.formatTime(new Date()),
      isAnonymous: data.isAnonymous
    };
    const messages = [...this.data.chatMessages, newMessage];
    this.setData({
      chatMessages: messages,
      lastMessageId: `msg-${newMessage.id}`
    });
    this.analyzeProductReview(data.content, data.displayName);
    this.addDanmakuMessage(`${data.displayName}: ${data.content}`);
  },

  handleGreetingReceived(data) {
    wx.showToast({ title: `${data.senderName}向您打了个招呼`, icon: 'none', duration: 2000 });
    this.showGreetingBubble(data);
  },

  handleBottleResponse(data) {
    if (data.hasResponse) {
      this.setData({ bottleCount: this.data.bottleCount + 1 });
      wx.showToast({ title: '收到新的漂流瓶回复', icon: 'success' });
    }
  },

  // ========== 产品榜单（保留）==========

  analyzeProductReview(content, displayName) {
    const foodKeywords = ['菜', '面', '饭', '汤', '肉', '鱼', '虾', '鸡', '牛', '羊', '猪', '香', '辣', '甜', '咸', '酸', '鲜', '美味', '好吃', '推荐'];
    const hasFoodKeyword = foodKeywords.some(keyword => content.includes(keyword));
    if (!hasFoodKeyword) return;

    const review = {
      id: Date.now() + Math.random(),
      content: content,
      user: displayName,
      timestamp: new Date().toISOString(),
      type: this.extractProductType(content),
      sentiment: this.analyzeSentiment(content)
    };
    const updatedReviews = [...this.data.productReviews, review];
    this.setData({ productReviews: updatedReviews });

    if (updatedReviews.length >= 5 && updatedReviews.length % 5 === 0) {
      this.generateProductRanking();
    }
  },

  extractProductType(content) {
    const productMap = {
      '面食': ['面', '面条', '拉面', '刀削面', '炸酱面'],
      '米饭': ['饭', '米饭', '盖浇饭', '炒饭'],
      '汤类': ['汤', '清汤', '浓汤', '炖汤'],
      '炒菜': ['炒', '爆炒', '回锅', '宫保'],
      '烧烤': ['烤', '烤肉', '烤串', '烧烤'],
      '火锅': ['火锅', '涮', '麻辣'],
      '凉菜': ['凉菜', '冷菜', '凉拌']
    };
    for (const [type, keywords] of Object.entries(productMap)) {
      if (keywords.some(keyword => content.includes(keyword))) return type;
    }
    return '其他';
  },

  analyzeSentiment(content) {
    const positiveWords = ['好吃', '美味', '香', '棒', '赞', '不错', '喜欢', '推荐', '满意', '很好', '太棒了', '绝了'];
    const negativeWords = ['难吃', '咸', '淡', '硬', '软', '糊', '失望', '一般', '不行', '不好', '不咋地'];
    let positiveCount = 0, negativeCount = 0;
    positiveWords.forEach(word => { if (content.includes(word)) positiveCount++; });
    negativeWords.forEach(word => { if (content.includes(word)) negativeCount++; });
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  },

  generateProductRanking() {
    if (this.data.productReviews.length === 0) return;
    const productStats = {};
    this.data.productReviews.forEach(review => {
      const type = review.type;
      if (!productStats[type]) {
        productStats[type] = { type, totalReviews: 0, positiveReviews: 0, allContent: [] };
      }
      productStats[type].totalReviews++;
      productStats[type].allContent.push(review.content);
      if (review.sentiment === 'positive') productStats[type].positiveReviews++;
    });

    const rankedProducts = Object.values(productStats)
      .map(product => ({
        ...product,
        positiveRate: product.totalReviews > 0
          ? (product.positiveReviews / product.totalReviews * 100).toFixed(1) : 0,
        reason: this.generateReason(product.allContent, product.type)
      }))
      .sort((a, b) => b.positiveRate - a.positiveRate)
      .slice(0, 3);

    this.setData({
      productRanking: rankedProducts,
      rankingLastUpdate: new Date().toLocaleTimeString()
    });
  },

  generateReason(reviewContents, productType) {
    const positiveReviews = reviewContents.filter(content => {
      const positiveWords = ['好吃', '美味', '香', '棒', '赞', '不错', '喜欢', '推荐'];
      return positiveWords.some(word => content.includes(word));
    });
    if (positiveReviews.length === 0) return [`${productType}口味独特，深受顾客喜爱`];

    const praiseWords = [];
    positiveReviews.slice(0, 5).forEach(content => {
      if (content.includes('好吃')) praiseWords.push('味道鲜美');
      if (content.includes('香')) praiseWords.push('香气浓郁');
      if (content.includes('推荐')) praiseWords.push('顾客极力推荐');
      if (content.includes('美味')) praiseWords.push('口感绝佳');
    });
    return praiseWords.length > 0 ? [...new Set(praiseWords)] : [`${productType}广受好评`];
  },

  toggleRankingPanel() {
    this.setData({ showRankingPanel: !this.data.showRankingPanel });
  },

  // ========== 弹幕（保留）==========

  toggleDanmaku() {
    const showDanmaku = !this.data.showDanmaku;
    this.setData({ showDanmaku });
    if (showDanmaku) {
      this.showToast('弹幕已开启');
      this.startDanmakuTimer();
    } else {
      this.showToast('弹幕已关闭');
      this.stopDanmakuTimer();
    }
  },

  addDanmakuMessage(content) {
    if (!this.data.showDanmaku) return;
    const message = { id: Date.now() + Math.random(), content, timestamp: Date.now() };
    const messages = [...this.data.danmakuMessages, message];
    if (messages.length > 10) messages.shift();
    this.setData({ danmakuMessages: messages });
  },

  startDanmakuTimer() {
    this.stopDanmakuTimer();
    this.danmakuTimer = setInterval(() => {
      const randomMessages = [
        '这里的招牌菜真的不错！', '推荐招牌牛肉面', '服务员态度很好',
        '环境很舒适', '价格比较实惠', 'wifi速度很快', '座位很舒适', '下次还会再来'
      ];
      const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
      const randomSender = `${Math.floor(Math.random() * 25) + 1}号桌`;
      if (Math.random() > 0.3) {
        this.addDanmakuMessage(`${randomSender}: ${randomMessage}`);
      }
    }, 3000);
  },

  stopDanmakuTimer() {
    if (this.danmakuTimer) {
      clearInterval(this.danmakuTimer);
      this.danmakuTimer = null;
    }
  },

  // ========== 互动按钮（保留）==========

  onOpenChat() {
    wx.navigateTo({
      url: `/pages/chat/group?storeId=${this.data.storeInfo.id}&storeName=${this.data.storeInfo.name}`
    });
  },

  onGreetingClick() {
    wx.navigateTo({ url: '/pages/greeting/send' });
  },

  onThrowBottleClick() {
    wx.navigateTo({ url: '/pages/bottle/throw' });
  },

  onPickBottleClick() {
    wx.navigateTo({ url: '/pages/bottle/list' });
  },

  onBottleClick() {
    wx.navigateTo({ url: '/pages/bottle/list' });
  },

  onMenuClick() {
    wx.showToast({ title: 'Demo模式：点餐功能需对接美团小程序', icon: 'none', duration: 2000 });
  },

  onExitStore() {
    wx.showModal({
      title: '确认离店',
      content: '离开店铺后2小时内无法再加入群聊，确定要离开吗？',
      success: (res) => {
        if (res.confirm) this.exitStore();
      }
    });
  },

  exitStore() {
    wx.setStorageSync('isInsideStore', false);
    const app = getApp();
    app.globalData.isInsideStore = false;
    this.setData({ isInsideStore: false });
    wx.showToast({ title: '已离开店铺', icon: 'success' });
  },

  onJoinGroup() {
    const app = getApp();
    app.globalData.isInsideStore = true;
    wx.setStorageSync('isInsideStore', true);
    this.setData({ isInsideStore: true });
    this.showToast('已进入餐厅，可以参与聊天和互动了！');
  },

  // ========== 主题切换（简化为 Demo 提示）==========

  onShowThemeSelector() {
    this.setData({ showThemeSelector: true });
  },

  onCloseThemeSelector() {
    this.setData({ showThemeSelector: false });
  },

  switchRestaurantType(type) {
    if (!type || type === this.data.currentRestaurantType) return;
    this.setData({
      currentRestaurantType: type,
      showThemeSelector: false
    });
    const names = { sichuan: '川菜小馆', cantonese: '粤式茶餐厅', japanese: '日式拉面馆', bbq: '烧烤店' };
    this.showToast(`Demo模式暂不切换，已选「${names[type] || type}」`);
  },

  quickSwitchType(e) {
    const type = typeof e === 'string' ? e : (e && e.currentTarget && e.currentTarget.dataset.type);
    this.switchRestaurantType(type);
  },

  // ========== 聊天（保留）==========

  onChatInput(e) {
    this.setData({ chatInput: e.detail.value });
  },

  onSendMessage() {
    const message = this.data.chatInput.trim();
    if (!message) return;
    const newMessage = {
      id: Date.now(),
      senderName: '我',
      content: message,
      time: this.formatTime(new Date())
    };
    const messages = [...this.data.chatMessages, newMessage];
    this.setData({ chatMessages: messages, chatInput: '', lastMessageId: `msg-${newMessage.id}` });
  },

  // ========== 工具方法 ==========

  showToast(message) {
    this.setData({ showToast: true, toastMessage: message });
    setTimeout(() => {
      this.setData({ showToast: false, toastMessage: '' });
    }, 2000);
  },

  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  showGreetingBubble(data) {
    const greetingId = `greeting_${Date.now()}`;
    this.setData({ currentGreeting: { id: greetingId, senderName: data.senderName, message: data.message, showTime: Date.now() } });
    setTimeout(() => {
      if (this.data.currentGreeting && this.data.currentGreeting.id === greetingId) {
        this.setData({ currentGreeting: null });
      }
    }, 3000);
  }
});

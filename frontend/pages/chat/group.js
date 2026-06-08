// 群聊页面逻辑
Page({
  /**
   * 页面数据
   */
  data: {
    storeInfo: {
      id: '',
      name: '示例餐厅'
    },
    groupId: '',
    memberCount: 0,
    messages: [],
    messageInput: '',
    isAnonymous: false,
    showEmojiPanel: false,
    loading: true,
    loadingText: '正在加载群聊...',
    refresherTriggered: false,
    loadingMore: false,
    hasMoreMessages: true,
    showError: false,
    errorMessage: '',
    lastMessageId: '',
    emojiList: [
      '😀', '😃', '😄', '😁', '😆', '😊', '😍', '🥰', '😘', '😗',
      '😙', '😚', '🙂', '🤗', '🤩', '🤔', '😐', '😑', '😶', '🙄',
      '😏', '😣', '😥', '😮', '🤐', '😪', '😴', '😌', '😛', '😜',
      '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️',
      '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨',
      '😩', '🤯', '😬', '😰', '😳', '🤪', '😵', '😡', '😠', '🤬',
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏',
      '🙌', '👐', '🙏', '✍️', '💪', '🦾', '🙅', '🙆', '💁', '🙋',
      '👨', '👩', '👦', '👧', '🧒', '👶', '🐶', '🐱', '🐭', '🐹',
      '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸',
      '🍔', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🍜', '🍲',
      '🍱', '🍛', '🍣', '🍤', '🍙', '🍘', '🍥', '🥠', '🍢', '🍡',
      '🍳', '🍞', '🥐', '🥖', '🧀', '🥚', '🍳', '🥓', '🥞', '🧇'
    ],
    currentPage: 1,
    pageSize: 20
  },

  /**
   * 页面生命周期：加载
   */
  onLoad(options) {
    this.setData({
      storeInfo: {
        id: options.storeId || 'demo_store',
        name: options.storeName || '示例餐厅'
      },
      groupId: options.groupId || options.storeId || 'demo_group'
    });
    
    this.initializeChat();
  },

  /**
   * 页面生命周期：显示
   */
  onShow() {
    // 检查用户是否在群聊中
    this.checkUserInGroup();
    
    // 连接WebSocket（如果未连接）
    this.ensureWebSocketConnection();
  },

  /**
   * 页面生命周期：隐藏
   */
  onHide() {
    // 断开WebSocket连接或暂停消息接收
    this.pauseWebSocketConnection();
  },

  /**
   * 页面生命周期：下拉刷新
   */
  onPullDownRefresh() {
    this.onRefresh();
  },

  /**
   * 初始化群聊
   */
  async initializeChat() {
    try {
      this.setData({ loading: true, loadingText: '正在加入群聊...' });
      
      // 检查用户认证状态
      const token = wx.getStorageSync('token');
      if (!token) {
        throw new Error('用户未登录');
      }
      
      // 加载群聊信息
      await this.loadGroupInfo();
      
      // 加载历史消息
      await this.loadMessages();
      
      // 连接实时消息
      this.connectToGroup();
      
      this.setData({ loading: false });
      
    } catch (error) {
      console.error('群聊初始化失败:', error);
      this.showError(error.message || '群聊加载失败，请重试');
      this.setData({ loading: false });
    }
  },

  /**
   * 加载群聊信息
   */
  async loadGroupInfo() {
    try {
      // 这里将调用后端API获取群聊信息
      // 现在是Mock数据
      const mockInfo = {
        memberCount: Math.floor(Math.random() * 50) + 10,
        isActive: true
      };
      
      this.setData({
        memberCount: mockInfo.memberCount
      });
      
    } catch (error) {
      console.error('加载群聊信息失败:', error);
      throw error;
    }
  },

  /**
   * 加载消息历史
   */
  async loadMessages() {
    try {
      const { currentPage, pageSize, groupId } = this.data;
      
      // 调用后端API获取历史消息
      // 现在是Mock数据
      const mockMessages = this.generateMockMessages(currentPage, pageSize);
      
      const existingMessages = this.data.messages;
      let newMessages = [];
      
      if (currentPage === 1) {
        // 首次加载
        newMessages = mockMessages;
      } else {
        // 加载更多
        newMessages = [...existingMessages, ...mockMessages];
      }
      
      // 按时间排序
      newMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      this.setData({
        messages: newMessages,
        hasMoreMessages: mockMessages.length === pageSize
      });
      
    } catch (error) {
      console.error('加载消息失败:', error);
      throw error;
    }
  },

  /**
   * 生成Mock消息
   */
  generateMockMessages(page, pageSize) {
    const messages = [];
    const messageTemplates = [
      '这家店的招牌菜真不错！',
      '服务员态度很好，上菜速度也很快',
      '环境很舒适，适合聚餐',
      '价格偏贵，但味道确实值这个价',
      '大家推荐什么菜品比较好？',
      '来晚了，基本都满了',
      '这个天气在这里吃饭很舒服',
      '有没有包间可以订？'
    ];
    
    for (let i = 0; i < pageSize; i++) {
      const messageId = (page - 1) * pageSize + i + 1;
      const timestamp = Date.now() - (page * pageSize - i) * 60000; // 模拟时间间隔
      
      messages.push({
        id: `msg_${messageId}`,
        type: 'user',
        content: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
        contentType: 'text',
        senderName: `用户${Math.floor(Math.random() * 20) + 1}`,
        tableNumber: Math.floor(Math.random() * 10) + 1,
        time: this.formatTime(new Date(timestamp)),
        timestamp: timestamp,
        isAnonymous: Math.random() > 0.7,
        isPinned: Math.random() > 0.95,
        showTimeDivider: i % 10 === 0, // 每10条消息显示一个时间分割
        actionsEnabled: true
      });
    }
    
    return messages;
  },

  /**
   * 连接群聊
   */
  connectToGroup() {
    // WebSocket连接将在后续阶段实现
    console.log('Connecting to group chat:', this.data.groupId);
    
    // 模拟接收新消息
    this.simulateIncomingMessages();
  },

  /**
   * 模拟接收消息（用于演示）
   */
  simulateIncomingMessages() {
    setInterval(() => {
      if (Math.random() > 0.7) { // 30%概率收到新消息
        this.addMockMessage();
      }
    }, 10000); // 每10秒检查一次
  },

  /**
   * 添加模拟消息
   */
  addMockMessage() {
    const mockMessages = [
      '有人要一起拼单吗？',
      '请问哪个菜最好吃？',
      '这家店来过好几次了',
      '看到有人推荐甜品，在哪里？',
      '环境真不错，适合拍照'
    ];
    
    const newMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: mockMessages[Math.floor(Math.random() * mockMessages.length)],
      contentType: 'text',
      senderName: `用户${Math.floor(Math.random() * 20) + 1}`,
      tableNumber: Math.floor(Math.random() * 10) + 1,
      time: this.formatTime(new Date()),
      timestamp: Date.now(),
      isAnonymous: Math.random() > 0.8,
      actionsEnabled: true
    };
    
    const messages = [...this.data.messages, newMessage];
    this.setData({
      messages: messages,
      lastMessageId: `msg-${newMessage.id}`
    });
  },

  /**
   * 消息输入处理
   */
  onMessageInput(e) {
    this.setData({
      messageInput: e.detail.value
    });
  },

  /**
   * 发送消息
   */
  async sendMessage() {
    const content = this.data.messageInput.trim();
    if (!content) return;
    
    try {
      const messageData = {
        groupId: this.data.groupId,
        content: content,
        isAnonymous: this.data.isAnonymous,
        contentType: 'text'
      };
      
      // 调用后端API发送消息（后续实现）
      console.log('Sending message:', messageData);
      
      // 添加到本地消息列表用于显示
      const newMessage = {
        id: `msg_${Date.now()}`,
        type: 'user',
        content: content,
        contentType: 'text',
        senderName: this.data.isAnonymous ? '匿名用户' : '我',
        time: this.formatTime(new Date()),
        timestamp: Date.now(),
        isAnonymous: this.data.isAnonymous,
        actionsEnabled: true
      };
      
      const messages = [...this.data.messages, newMessage];
      
      this.setData({
        messages: messages,
        messageInput: '',
        lastMessageId: `msg-${newMessage.id}`
      });
      
    } catch (error) {
      console.error('发送消息失败:', error);
      this.showError('发送消息失败，请重试');
    }
  },

  /**
   * 切换匿名模式
   */
  toggleAnonymous(e) {
    this.setData({
      isAnonymous: e.detail.value
    });
  },

  /**
   * 显示/隐藏表情面板
   */
  showEmojiPanel() {
    this.setData({
      showEmojiPanel: true
    });
  },

  hideEmojiPanel() {
    this.setData({
      showEmojiPanel: false
    });
  },

  /**
   * 插入表情
   */
  insertEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji;
    const currentInput = this.data.messageInput;
    
    this.setData({
      messageInput: currentInput + emoji
    });
  },

  /**
   * 下拉刷新
   */
  async onRefresh() {
    try {
      this.setData({
        refresherTriggered: true,
        currentPage: 1,
        messages: []
      });
      
      await this.loadMessages();
      
      this.setData({ refresherTriggered: false });
      
    } catch (error) {
      console.error('刷新失败:', error);
      this.setData({ refresherTriggered: false });
      this.showError('刷新失败，请重试');
    }
  },

  /**
   * 加载更多消息
   */
  async loadMoreMessages() {
    if (this.data.loadingMore || !this.data.hasMoreMessages) return;
    
    try {
      this.setData({ loadingMore: true });
      
      const nextPage = this.data.currentPage + 1;
      this.setData({ currentPage: nextPage });
      
      await this.loadMessages();
      
    } catch (error) {
      console.error('加载更多消息失败:', error);
      this.showError('加载失败，请重试');
    } finally {
      this.setData({ loadingMore: false });
    }
  },

  /**
   * 回复消息
   */
  replyToMessage(e) {
    const messageId = e.currentTarget.dataset.messageId;
    // 回复功能将在后续实现
    this.showError('回复功能即将开放');
  },

  /**
   * 发送打招呼
   */
  sendGreeting() {
    const greetingTemplates = [
      '大家好！',
      '有人在吗？',
      '各位好呀～',
      '有人一起拼单吗？',
      '请问有人推荐菜品吗？'
    ];
    
    const greeting = greetingTemplates[Math.floor(Math.random() * greetingTemplates.length)];
    this.setData({ messageInput: greeting });
  },

  /**
   * 推荐菜品
   */
  sendDishRecommendation() {
    wx.showToast({
      title: '请分享到群聊',
      icon: 'none'
    });
  },

  /**
   * 废弃漂流瓶
   */
  sendBottle() {
    // 跳转到漂流瓶页面
    wx.navigateTo({
      url: '/pages/bottle/list'
    });
  },

  /**
   * 显示群聊信息
   */
  showGroupInfo() {
    wx.showModal({
      title: '群聊信息',
      content: `店铺: ${this.data.storeInfo.name}\n在线人数: ${this.data.memberCount}\n群聊ID: ${this.data.groupId}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 检查用户是否在群聊中
   */
  checkUserInGroup() {
    // 在实际实现中将检查用户状态
    // 现在假设用户已在群聊中
  },

  /**
   * 确保WebSocket连接
   */
  ensureWebSocketConnection() {
    // WebSocket连接管理将在后续实现
  },

  /**
   * 暂停WebSocket连接
   */
  pauseWebSocketConnection() {
    // 暂停消息接收
  },

  /**
   * 显示错误提示
   */
  showError(message) {
    this.setData({
      showError: true,
      errorMessage: message
    });
    
    setTimeout(() => {
      this.setData({
        showError: false,
        errorMessage: ''
      });
    }, 3000);
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${month} ${day} ${hours}:${minutes}`;
  }
});
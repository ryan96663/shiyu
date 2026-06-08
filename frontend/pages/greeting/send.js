// 打招呼预设话术库
const GREETING_PRESETS = [
  '你好呀！今天这家店怎么样？',
  '哈喽～有人一起拼单吗？',
  '大家好，这家有什么推荐的吗？',
  'Hi~ 今天天气真好，吃得开心！',
  '一个人吃饭，有要聊天的吗？',
  '请问这个桌的菜好吃吗？想参考一下',
  '刚来，求推荐必点菜！',
  '晚上好，这里氛围真不错～',
  '看到你们桌的菜好香！点的什么呀？',
  '新人报到，多多关照～',
  '有一起点外卖拼单的吗？',
  '周末愉快！这家店种草好久了',
  '请问甜品推荐哪款？',
  '等位等了好久，终于吃上了！',
  '第一次来，有什么避坑建议吗？'
];

Page({
  data: {
    greetingText: '',
    inputText: '',
    isCustom: false,
    canSend: true
  },

  onLoad() {
    // 随机选一条预设
    const randomPreset = GREETING_PRESETS[Math.floor(Math.random() * GREETING_PRESETS.length)];
    this.setData({ greetingText: randomPreset });
  },

  // 换一句
  onRefresh() {
    const randomPreset = GREETING_PRESETS[Math.floor(Math.random() * GREETING_PRESETS.length)];
    this.setData({
      greetingText: randomPreset,
      inputText: '',
      isCustom: false,
      canSend: true
    });
  },

  // 自定义输入
  onInput(e) {
    const value = e.detail.value;
    if (value.length > 30) return;
    const isCustom = value.length > 0;
    this.setData({
      inputText: value,
      isCustom: isCustom,
      canSend: isCustom ? value.trim().length > 0 : true
    });
  },

  // 发送
  onSend() {
    const content = this.data.isCustom ? this.data.inputText.trim() : this.data.greetingText;
    if (!content) return;

    console.log('[打招呼] 发送内容:', content);
    wx.showToast({ title: '已向邻桌打了个招呼！', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 1200);
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});

/**
 * 配置文件
 */

const jwtConfig = require('./jwt');

const config = {
  // JWT 配置
  ...jwtConfig,
  
  // 服务器配置
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // 数据库配置
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/foodie_social',
  
  // Redis配置
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // 模拟店铺数据
  STORES: {
    'store_001': {
      id: 'store_001',
      name: '美味中餐厅',
      address: '北京市朝阳区建国路1号',
      latitude: 39.9042,
      longitude: 116.4074,
      phone: '010-12345678',
      wifi: {
        ssid: 'WangRestaurant',
        bssid: 'aa:bb:cc:dd:ee:ff'
      }
    },
    'store_002': {
      id: 'store_002',
      name: '日式料理屋',
      address: '上海市浦东新区陆家嘴100号',
      latitude: 31.2304,
      longitude: 121.4737,
      phone: '021-87654321',
      wifi: {
        ssid: 'SakuraSushi',
        bssid: 'ff:ee:dd:cc:bb:aa'
      }
    },
    'store_003': {
      id: 'store_003',
      name: '意式披萨店',
      address: '广州市天河区天河路200号',
      latitude: 23.1291,
      longitude: 113.2644,
      phone: '020-99887766',
      wifi: {
        ssid: 'PizzaTime',
        bssid: '11:22:33:44:55:66'
      }
    }
  },

  // Socket.IO 配置
  SOCKET_IO: {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    maxBufferSize: 5 * 1024 * 1024, // 5MB
    pingTimeout: 30000,
    pingInterval: 25000
  },

  // 验证配置
  VERIFICATION: {
    // 位置验证配置
    LOCATION: {
      MAX_DISTANCE: 50, // 米
      MAX_ACCURACY: 10, // 米
      INSIDE_DISTANCE: 30, // 米
    },
    // 订单验证超时
    ORDER_TIMEOUT: 300000, // 5分钟毫秒
    // 漂洗瓶超时
    BOTTLE_TIMEOUT: 180000 // 3分钟毫秒
  },

  // 群组配置
  GROUP: {
    // 店内时长限制
    INSIDE_MAX_DURATION: 6 * 60 * 60 * 1000, // 6小时毫秒
    // 离店后时长限制
    OUTSIDE_MAX_DURATION: 2 * 60 * 60 * 1000, // 2小时毫秒
    // 检查间隔
    CHECK_INTERVAL: 60000 // 1分钟毫秒
  },

  // 漂洗瓶配置
  BOTTLE: {
    // 每日最大发送数量
    DAILY_MAX_SENT: 10,
    // 每日最多不同店铺
    DAILY_MAX_STORES: 5,
    // 最大对话数量
    MAX_CONVERSATIONS: 20,
    // 超时池查询间隔
    POOL_CHECK_INTERVAL: 30000 // 30秒毫秒
  },

  // 安全配置
  SECURITY: {
    // 防刷屏限制
    JOIN_COOLDOWN: 60 * 60 * 1000, // 1小时毫秒
    // 敏感词过滤
    SENSITIVE_WORDS: ['差评', '坑', '不好吃', '垃圾', '骗子']
  },

  // 漂流瓶配置
  BOTTLE_EXPIRE_HOURS: 24,
  BOTTLE_DAILY_LIMIT: 3,
  
  // 评价配置
  REVIEW_DAILY_LIMIT: 10,

  // 数据库配置（兼容旧引用路径）
  database: {
    mongodb: { uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie_social' },
    redis: { uri: process.env.REDIS_URI || 'redis://localhost:6379' }
  }
};

module.exports = config;
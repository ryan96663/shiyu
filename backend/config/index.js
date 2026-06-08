/**
 * 配置文件
 * @author Foodie Social Team
 */

const dotenv = require('dotenv');
dotenv.config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },
  
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/foodie_social'
    },
    redis: {
      uri: process.env.REDIS_URI || 'redis://localhost:6379'
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'foodie-social-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'foodie-social-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
    miniProgramId: process.env.WECHAT_MINI_PROGRAM_ID,
    miniProgramSecret: process.env.WECHAT_MINI_PROGRAM_SECRET
  },

  meituan: {
    apiKey: process.env.MEITUAN_API_KEY,
    apiSecret: process.env.MEITUAN_API_SECRET,
    baseUrl: process.env.MEITUAN_BASE_URL || 'https://openapi.meituan.com'
  },

  ai: {
    baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    timeout: process.env.AI_TIMEOUT || 30000,
    imageGeneration: {
      maxRetries: 3,
      timeout: 60000
    }
  },

  storage: {
    type: process.env.STORAGE_TYPE || 'local', // local, tencent, aliyun
    local: {
      uploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads'
    },
    tencent: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
      bucket: process.env.TENCENT_BUCKET,
      region: process.env.TENCENT_REGION || 'ap-beijing'
    }
  },

  rateLimit: {
    windowMs: 60 * 1000, // 1分钟
    max: 100, // 限制每个IP 100个请求
    message: '请求过于频繁，请稍后再试'
  },

  business: {
    group: {
      maxDuration: 6, // 群聊最大持续时间(小时)
      autoLeaveAfterExit: 2, // 离店后自动退群时间(小时)
      maxMembers: 50, // 群聊最大成员数
      messageHistoryHours: 24 // 消息历史保留时间(小时)
    },
    bottle: {
      dailyLimit: 10, // 每日漂流瓶限制
      storeDailyLimit: 5, // 每日针对店铺限制
      maxResponses: 20, // 单个漂流瓶最大回复数
      expirationHours: 24 // 漂流瓶过期时间(小时)
    },
    review: {
      minContentLength: 10, // 评价最小字数
      maxContentLength: 500, // 评价最大字数
      maxImages: 5 // 单条评价最大图片数
    }
  },

  websocket: {
    pingTimeout: 60000,
    pingInterval: 25000,
    maxBufferSize: 1048576, // 1MB
    maxMessageLength: 8192 // 8KB
  },

  security: {
    corsOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    rateLimitWindowMs: 60000,
    rateLimitMax: 100,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif']
  }
};

// 根据环境调整配置
if (config.server.env === 'production') {
  config.database.mongodb.uri = process.env.MONGODB_URI_PROD;
  config.database.redis.uri = process.env.REDIS_URI_PROD;
  config.jwt.expiresIn = '12h';
  config.business.group.maxMembers = 100;
} else if (config.server.env === 'test') {
  config.database.mongodb.uri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/foodie_social_test';
  config.database.redis.uri = process.env.REDIS_URI_TEST || 'redis://localhost:6379/1';
}

// 验证必要配置
const requiredConfigs = [
  'wechat.appId',
  'wechat.appSecret',
  'jwt.secret',
  'ai.baseUrl'
];

const validateConfig = (obj, path) => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (!current[key]) {
      return false;
    }
    current = current[key];
  }
  
  return current;
};

requiredConfigs.forEach(path => {
  if (!validateConfig(config, path)) {
    console.warn(`⚠️ 警告: 缺少必要配置项: ${path}`);
  }
});

module.exports = config;
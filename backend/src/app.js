/**
 * 美食社交小程序 - 后端主应用
 * @author Foodie Social Team
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const redis = require('redis');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
require('dotenv').config();

// 路由导入
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const storeRoutes = require('./routes/store');
const groupRoutes = require('./routes/group');
const bottleRoutes = require('./routes/bottle');
const reviewRoutes = require('./routes/review');
const aiRoutes = require('./routes/ai');

// 中间件导入
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const loggerMiddleware = require('./middleware/logger');

// Socket.io服务
const socketService = require('./services/socketService');

// 定时任务服务
const schedulerService = require('./services/scheduler');

// 配置导入
const config = require('../config');

class App {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.logger = this.setupLogger();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocket();
    this.initializeScheduler();
    this.initializeErrorHandler();
  }

  setupLogger() {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'foodie-social' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  initializeMiddleware() {
    // 安全中间件
    this.app.use(helmet());
    
    // CORS配置
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // 请求限制
    const limiter = rateLimit({
      windowMs: 60 * 1000, // 1分钟
      max: 100, // 限制100个请求
      message: {
        code: 40006,
        message: '请求过于频繁，请稍后再试'
      }
    });
    this.app.use('/api/', limiter);

    // 解析中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 日志中间件
    this.app.use(loggerMiddleware(this.logger));
  }

  initializeRoutes() {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API版本前缀
    const apiPrefix = '/api/v1';

    // 公共路由
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/store`, storeRoutes);

    // 受保护路由
    this.app.use(`${apiPrefix}/user`, authMiddleware, userRoutes);
    this.app.use(`${apiPrefix}/group`, authMiddleware, groupRoutes);
    this.app.use(`${apiPrefix}/bottle`, authMiddleware, bottleRoutes);
    this.app.use(`${apiPrefix}/review`, authMiddleware, reviewRoutes);
    this.app.use(`${apiPrefix}/ai`, authMiddleware, aiRoutes);
  }

  initializeSocket() {
    // 初始化Socket.io服务
    this.socketService = new socketService(this.io);

    this.logger.info('Socket.io服务已初始化');
  }

  initializeScheduler() {
    // 初始化定时任务服务
    this.schedulerService = new schedulerService(this.io, this.socketService);
    
    // 在服务器启动后启动定时任务
    setImmediate(() => {
      this.schedulerService.start();
    });
    
    this.logger.info('定时任务服务已初始化');
  }

  initializeErrorHandler() {
    this.app.use(errorHandler(this.logger));
  }

  async connectDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || config.database.mongodb.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 10000,
      });
      this.logger.info('MongoDB连接成功');
    } catch (error) {
      this.logger.warn('MongoDB连接失败（使用内存存储继续运行）:', error.message);
    }
  }

  async connectRedis() {
    try {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URI || config.database.redis.uri,
        socket: { connectTimeout: 3000, reconnectStrategy: false }
      });
      await this.redisClient.connect();
      this.logger.info('Redis连接成功');
    } catch (error) {
      this.logger.warn('Redis连接失败（使用内存存储继续运行）:', error.message);
    }
  }

  async start() {
    try {
      // 确保logs目录存在
      const fs = require('fs');
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
      }

      // 连接数据库
      await this.connectDatabase();
      await this.connectRedis();

      const port = process.env.PORT || config.PORT || 3000;
      
      this.server.listen(port, () => {
        this.logger.info(`服务器启动成功，监听端口: ${port}`);
        this.logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
        this.logger.info(`API文档: http://localhost:${port}/api/docs`);
      });

      // 优雅关闭
      process.on('SIGTERM', () => {
        this.logger.info('收到SIGTERM信号，正在关闭服务器...');
        this.server.close(() => {
          this.logger.info('服务器已关闭');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        this.logger.info('收到SIGINT信号，正在关闭服务器...');
        this.server.close(() => {
          this.logger.info('服务器已关闭');
          process.exit(0);
        });
      });

    } catch (error) {
      this.logger.error('服务器启动失败:', error);
      process.exit(1);
    }
  }
}

// 创建并启动应用
const app = new App();

if (require.main === module) {
  app.start().catch(console.error);
}

module.exports = app;
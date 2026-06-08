/**
 * 定时任务服务
 * 处理自动退群、漂洗瓶超时等定时操作
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const config = require('../config');

class SchedulerService {
  constructor(io, socketService) {
    this.io = io;
    this.socketService = socketService;
    this.tasks = new Map();
    
    logger.info('定时任务服务初始化');
  }

  /**
   * 启动所有定时任务
   */
  start() {
    this.startGroupCleanup();
    this.startBottleTimeoutCheck();
    
    logger.info('所有定时任务已启动');
  }

  /**
   * 停止所有定时任务
   */
  stop() {
    for (const [taskName, task] of this.tasks.entries()) {
      if (task && task.stop) {
        task.stop();
      }
      logger.info('定时任务已停止', { taskName });
    }
    this.tasks.clear();
  }

  /**
   * 启动群组清理任务（自动退群）
   * 每分钟检查一次，清理超时用户
   */
  startGroupCleanup() {
    const task = cron.schedule('* * * * *', async () => {
      try {
        await this.cleanupExpiredGroupMembers();
      } catch (error) {
        logger.error('群组清理任务失败', { error: error.message });
      }
    });

    this.tasks.set('groupCleanup', task);
    logger.info('群组清理任务已启动 - 每分钟执行一次');
  }

  /**
   * 启动漂洗瓶超时检查
   * 每30秒检查一次过期的瓶子
   */
  startBottleTimeoutCheck() {
    const task = cron.schedule('*/30 * * * * *', async () => {
      try {
        await this.checkBottleTimeouts();
      } catch (error) {
        logger.error('漂洗瓶超时检查任务失败', { error: error.message });
      }
    });

    this.tasks.set('bottleTimeout', task);
    logger.info('漂洗瓶超时检查任务已启动 - 每30秒执行一次');
  }

  /**
   * 清理过期的群组成员
   * 检查所有活跃用户，移除超时用户
   */
  async cleanupExpiredGroupMembers() {
    try {
      logger.debug('开始群组成员超时检查');
      
      const now = Date.now();
      const expiredUsers = [];

      // 遍历所有在线用户
      for (const [socketId, userInfo] of this.socketService.connectedUsers.entries()) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket) continue;

        // 获取用户所在的群组房间
        const groupRooms = Array.from(socket.rooms).filter(room => 
          room.startsWith('group:') && room !== socketId
        );

        for (const room of groupRooms) {
          const storeId = room.replace('group:', '');
          
          // 计算用户应该什么时候离开
          const shouldLeaveAt = this.calculateLeaveTime(userInfo, now);
          
          if (shouldLeaveAt && now >= shouldLeaveAt) {
            expiredUsers.push({
              userId: userInfo.userId,
              socketId,
              storeId,
              shouldLeaveAt,
              currentTime: now
            });
          }
        }
      }

      // 处理过期用户
      for (const expiredUser of expiredUsers) {
        await this.forceLeaveGroup(expiredUser);
      }

      if (expiredUsers.length > 0) {
        logger.info('群组成员清理完成', { 
          expiredCount: expiredUsers.length,
          users: expiredUsers.map(u => ({ userId: u.userId, storeId: u.storeId }))
        });
      }

    } catch (error) {
      logger.error('群组成员清理失败', { error: error.message, stack: error.stack });
    }
  }

  /**
   * 计算用户应该离开群组的时间
   */
  calculateLeaveTime(userInfo, currentTime) {
    const joinedAt = userInfo.joinedAt ? new Date(userInfo.joinedAt).getTime() : null;
    
    if (!joinedAt) return null;

    // 根据店内/店外状态计算最大时长
    const maxDuration = userInfo.isInside 
      ? config.GROUP.INSIDE_MAX_DURATION 
      : config.GROUP.OUTSIDE_MAX_DURATION;

    return joinedAt + maxDuration;
  }

  /**
   * 强制用户离开群组
   */
  async forceLeaveGroup(userInfo) {
    try {
      const { userId, socketId, storeId } = userInfo;
      
      // 获取socket
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        // 离开群组房间
        socket.leave(`group:${storeId}`);
        
        // 发送系统通知
        socket.emit('group:forced_leave', {
          storeId,
          reason: '超出停留时间限制',
          timestamp: new Date().toISOString()
        });
        
        // 广播用户离开
        this.io.to(`group:${storeId}`).emit('user:offline', {
          userId,
          displayName: `${userInfo.tableNumber || '??'}号桌`,
          groupId: storeId,
          reason: '超时自动退群',
          isInside: false,
          exitTime: new Date().toISOString()
        });
      }

      // 从用户连接信息中移除群组相关数据
      if (userInfo.rooms) {
        userInfo.rooms = userInfo.rooms.filter(room => !room.startsWith('group:'));
        userInfo.status = 'left';
      }

      logger.info('用户已强制离开群组', {
        userId,
        socketId,
        storeId,
        forceLeave: true
      });

    } catch (error) {
      logger.error('强制离开群组失败', {
        userId: userInfo.userId,
        storeId: userInfo.storeId,
        error: error.message
      });
    }
  }

  /**
   * 检查漂洗瓶超时
   * 处理超时未回复或分配的瓶子
   */
  async checkBottleTimeouts() {
    try {
      logger.debug('开始漂洗瓶超时检查');
      
      // 模拟Redis中的瓶子数据
      // 实际项目中这里会连接Redis检查过期的瓶子
      const currentTime = Date.now();
      
      // 假设我们有一个bottleStorage存储所有瓶子
      if (global.bottleStorage) {
        const expiredBottles = [];
        
        for (const [bottleId, bottle] of global.bottleStorage.entries()) {
          if (bottle.status === 'pending' && 
              (currentTime - bottle.createdAt) > config.VERIFICATION.BOTTLE_TIMEOUT) {
            expiredBottles.push({ bottleId, bottle });
          }
        }

        // 处理过期瓶子
        for (const { bottleId, bottle } of expiredBottles) {
          await this.processExpiredBottle(bottleId, bottle);
        }

        if (expiredBottles.length > 0) {
          logger.info('漂洗瓶超时处理完成', { expiredCount: expiredBottles.length });
        }
      }

    } catch (error) {
      logger.error('漂洗瓶超时检查失败', { error: error.message });
    }
  }

  /**
   * 处理过期的漂洗瓶
   */
  async processExpiredBottle(bottleId, bottle) {
    try {
      // 更新瓶子状态为过期
      bottle.status = 'expired';
      bottle.expiredAt = Date.now();
      
      // 通知原发送者
      if (this.socketService.sendToUser) {
        this.socketService.sendToUser(bottle.senderId, 'bottle:expired', {
          bottleId,
          reason: '瓶子超时未有人回应',
          expiredAt: new Date().toISOString()
        });
      }
      
      // 可以将瓶子移到公共池等待其他人拾取
      if (bottle.storeId) {
        this.moveBottleToPool(bottleId, bottle);
      }
      
      logger.info('漂洗瓶已处理', {
        bottleId,
        senderId: bottle.senderId,
        storeId: bottle.storeId,
        action: 'expired'
      });

    } catch (error) {
      logger.error('处理过期漂洗瓶失败', {
        bottleId,
        error: error.message
      });
    }
  }

  /**
   * 将瓶子移到公共池
   */
  moveBottleToPool(bottleId, bottle) {
    try {
      // 实际项目中，这里会将瓶子添加到Redis的公共池中
      logger.info('瓶子已移到公共池', {
        bottleId,
        storeId: bottle.storeId
      });
    } catch (error) {
      logger.error('移动瓶子到公共池失败', {
        bottleId,
        error: error.message
      });
    }
  }

  /**
   * 重置定时任务
   */
  restart() {
    this.stop();
    this.start();
  }

  /**
   * 获取定时任务状态
   */
  getStatus() {
    const status = {};
    for (const [taskName, task] of this.tasks.entries()) {
      status[taskName] = {
        running: task.running,
        lastExecution: task.lastExecution ? task.lastExecution.toISOString() : null
      };
    }
    return status;
  }
}

module.exports = SchedulerService;
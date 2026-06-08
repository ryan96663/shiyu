/**
 * WebSocket服务
 * Socket.io事件分发框架
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
    this.userSockets = new Map();
    this.pendingJoinData = new Map();
    this.setupMiddleware();
    this.setupEventHandlers();
    logger.info('Socket服务已初始化');
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token ||
                     socket.handshake.headers.authorization ||
                     socket.handshake.query.token;
        if (!token) throw new Error('缺少认证token');
        const tokenValue = token.replace(/^Bearer\s+/i, '');
        const decoded = jwt.verify(tokenValue, config.JWT_SECRET);
        socket.user = decoded;
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (err) {
        logger.error('Socket认证失败', { error: err.message });
        next(new Error('Socket认证失败: ' + err.message));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('新Socket连接', { socketId: socket.id });
      this.handleConnection(socket);
      this.setupUserEvents(socket);
      this.setupGroupEvents(socket);
      this.handleBottleEvents(socket);
      socket.on('disconnect', (reason) => this.handleDisconnection(socket, reason));
    });
  }

  handleConnection(socket) {
    this.connectedUsers.set(socket.id, {
      userId: socket.userId, socketId: socket.id,
      connectedAt: new Date(), userRole: socket.userRole
    });
    if (!this.userSockets.has(socket.userId)) this.userSockets.set(socket.userId, new Set());
    this.userSockets.get(socket.userId).add(socket.id);
    this.io.emit('user:online', { userId: socket.userId, timestamp: new Date().toISOString() });

    const pendingData = this.pendingJoinData.get(socket.userId);
    if (pendingData) {
      socket.join(`group:${pendingData.storeId}`);
      socket.emit('group:joined', {
        groupId: pendingData.storeId,
        tableNumber: pendingData.tableNumber,
        displayName: pendingData.displayName
      });
      this.pendingJoinData.delete(socket.userId);
    }

    logger.info('用户连接', { userId: socket.userId, total: this.connectedUsers.size });
  }

  handleDisconnection(socket, reason) {
    const userSocketSet = this.userSockets.get(socket.userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(socket.userId);
        this.io.emit('user:offline', { userId: socket.userId, timestamp: new Date().toISOString() });
      }
    }
    this.connectedUsers.delete(socket.id);
    socket.rooms.forEach(room => {
      if (room !== socket.id)
        this.io.to(room).emit('user:left', { userId: socket.userId, groupId: room, reason: 'connection lost', timestamp: new Date().toISOString() });
    });
    logger.info('用户断开', { userId: socket.userId, reason, remaining: this.connectedUsers.size });
  }

  setupUserEvents(socket) {
    socket.on('ping', () => socket.emit('pong'));
    socket.on('error', (err) => logger.error('Socket错误', { socketId: socket.id, userId: socket.userId, error: err.message }));
  }

  setupGroupEvents(socket) {
    socket.on('group:join', (data) => {
      try {
        const { groupId, tableNumber, displayName } = data;
        socket.join(groupId);
        this.io.to(groupId).emit('user:online', {
          userId: socket.userId, displayName: displayName || `${tableNumber}号桌`,
          tableNumber, groupId, timestamp: new Date().toISOString()
        });
        logger.info('用户加入群聊', { userId: socket.userId, groupId, tableNumber });
      } catch (err) { socket.emit('error', { message: '加入群聊失败', details: err.message }); }
    });

    socket.on('group:leave', (data) => {
      try {
        socket.leave(data.groupId);
        this.io.to(data.groupId).emit('user:offline', { userId: socket.userId, groupId: data.groupId, timestamp: new Date().toISOString() });
      } catch (err) { logger.error('离开群聊失败', { error: err.message }); }
    });

    socket.on('message:send', (data) => {
      try {
        const { groupId, content, messageType, isAnonymous } = data;
        if (!socket.rooms.has(groupId)) throw new Error('用户不在指定的群聊中');
        socket.to(groupId).emit('message:new', {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content, senderId: socket.userId,
          displayName: isAnonymous ? '匿名用户' : `${data.tableNumber || '??'}号桌`,
          isAnonymous, messageType: messageType || 'text', groupId, timestamp: new Date().toISOString()
        });
      } catch (err) { socket.emit('error', { message: '发送消息失败', details: err.message }); }
    });

    socket.on('greeting:send', (data) => {
      try {
        const { targetUserId, groupId, message } = data;
        this.sendToUser(targetUserId, 'greeting:received', { senderId: socket.userId, message, groupId, timestamp: new Date().toISOString() });
        this.io.to(groupId).emit('greeting:broadcast', { senderId: socket.userId, targetId: targetUserId, timestamp: new Date().toISOString() });
      } catch (err) { logger.error('打招呼失败', { error: err.message }); }
    });

    socket.on('bottle:reply_notify', (data, callback) => {
      try {
        this.sendToUser(data.originalSenderId, 'bottle:reply_received', {
          bottleId: data.bottleId, replyContent: data.replyContent,
          senderId: socket.userId, replyTime: new Date().toISOString()
        });
        if (callback) callback({ success: true });
      } catch (err) { if (callback) callback({ success: false, error: err.message }); }
    });
  }

  getUserSockets(userId) { return Array.from(this.userSockets.get(userId) || []); }

  sendToUser(userId, event, data) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) { socketIds.forEach(sid => this.io.to(sid).emit(event, data)); return true; }
    return false;
  }

  getRoomUsers(roomName) {
    try {
      const sockets = this.io.sockets.adapter.rooms.get(roomName);
      if (!sockets) return [];
      const users = [];
      for (const sid of sockets) {
        const uid = this.getUserBySocketId(sid);
        if (uid) users.push({ userId: uid, socketId: sid });
      }
      return users;
    } catch (e) { return []; }
  }

  getUserBySocketId(socketId) { return this.connectedUsers.get(socketId)?.userId; }

  getUserRoomData(userId) {
    const set = this.userSockets.get(userId);
    if (!set || set.size === 0) return null;
    for (const sid of set) {
      const info = this.connectedUsers.get(sid);
      if (info) {
        const socket = this.io.sockets.sockets.get(sid);
        if (socket) return { userId, socketId: sid, rooms: Array.from(socket.rooms).filter(r => r !== sid), userRole: info.userRole, connectedAt: info.connectedAt, status: 'active' };
      }
    }
    return null;
  }

  addPendingUser(userId, joinData) { this.pendingJoinData.set(userId, joinData); }

  leaveGroup(userId, groupId, isInside) {
    const set = this.userSockets.get(userId);
    if (!set) return;
    for (const sid of set) {
      const socket = this.io.sockets.sockets.get(sid);
      if (socket) { socket.leave(groupId); this.io.to(groupId).emit('user:offline', { userId, groupId, isInside, exitTime: new Date().toISOString() }); }
    }
  }

  sendGreeting(senderId, targetUserId, groupId, message) {
    this.sendToUser(targetUserId, 'greeting:received', { senderId, message, groupId, timestamp: new Date().toISOString() });
    this.io.to(`group:${groupId}`).emit('greeting:broadcast', { senderId, targetId: targetUserId, timestamp: new Date().toISOString() });
  }

  handleBottleEvents(socket) {
    socket.on('bottle:pick', (data, cb) => { if (cb) cb({ success: true }); });
    socket.on('bottle:reply_notify', (data, cb) => {
      try {
        this.sendToUser(data.originalSenderId, 'bottle:reply_received', { bottleId: data.bottleId, replyContent: data.replyContent, senderId: socket.userId, replyTime: new Date().toISOString() });
        if (cb) cb({ success: true });
      } catch (err) { if (cb) cb({ success: false, error: err.message }); }
    });
  }

  getStats() { return { totalConnections: this.connectedUsers.size, totalUsers: this.userSockets.size }; }
}

module.exports = SocketService;

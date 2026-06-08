/**
 * 日志中间件
 */

const config = require('../config');

/**
 * 请求日志中间件
 * 记录每个请求的信息
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  // 在请求对象中添加requestId
  req.requestId = requestId;
  
  // 记录请求信息
  const requestLog = {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    timestamp: new Date().toISOString()
  };
  
  if (req.user) {
    requestLog.userId = req.userId;
    requestLog.userRole = req.userRole;
  }
  
  // 记录查询参数
  if (Object.keys(req.query).length > 0) {
    requestLog.query = req.query;
  }
  
  // 记录请求体（只记录非敏感信息）
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // 过滤敏感字段
    const sensitiveFields = ['password', 'token', 'auth', 'secret'];
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[REDACTED]';
      }
    });
    requestLog.body = sanitizedBody;
  }
  
  // 请求结束时的处理
  const cleanup = () => {
    res.removeListener('finish', onFinish);
    res.removeListener('close', onClose);
    res.removeListener('error', onError);
  };
  
  const onFinish = () => {
    cleanup();
    
    const responseTime = Date.now() - start;
    const responseLog = {
      requestId,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('content-length')
    };
    
    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      console.error('[REQUEST]', Object.assign(requestLog, responseLog));
    } else if (res.statusCode >= 400) {
      console.warn('[REQUEST]', Object.assign(requestLog, responseLog));
    } else if (config.LOG_LEVEL === 'debug') {
      console.info('[REQUEST]', Object.assign(requestLog, responseLog));
    }
  };
  
  const onClose = () => {
    cleanup();
    const responseTime = Date.now() - start;
    console.warn('[REQUEST INTERRUPTED]', {
      requestId,
      responseTime: `${responseTime}ms`,
      reason: 'Client disconnected'
    });
  };
  
  const onError = (err) => {
    cleanup();
    const responseTime = Date.now() - start;
    console.error('[REQUEST ERROR]', {
      requestId,
      error: err.message,
      responseTime: `${responseTime}ms`
    });
  };
  
  // 添加监听器
  res.on('finish', onFinish);
  res.on('close', onClose);
  res.on('error', onError);
  
  // 处理请求体解析错误
  if (req.on) {
    req.on('error', (err) => {
      console.error('[REQUEST BODY ERROR]', {
        requestId,
        error: err.message,
        url: req.url
      });
    });
  }
  
  if (config.LOG_LEVEL === 'debug') {
    console.log('[REQUEST START]', requestLog);
  }
  
  next();
};

/**
 * 访问日志中间件（简化版）
 * 只记录基本访问信息
 */
const accessLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const status = res.statusCode;
    
    // 简单的访问日志格式: method url status responseTime
    console.log(`[ACCESS] ${req.method} ${req.url} ${status} ${responseTime}ms`);
  });
  
  next();
};

/**
 * WebSocket连接日志
 * @param {Object} socket - WebSocket socket对象
 */
const websocketLogger = (socket) => {
  const logConnection = () => {
    console.log('[WS] Connection established', {
      id: socket.id,
      remoteAddress: socket.handshake.address,
      userId: socket.userId,
      url: socket.handshake.url
    });
  };
  
  const logDisconnection = () => {
    console.log('[WS] Connection closed', {
      id: socket.id,
      userId: socket.userId,
      reason: 'Client disconnected'
    });
  };
  
  const logError = (err) => {
    console.error('[WS] Connection error', {
      id: socket.id,
      userId: socket.userId,
      error: err.message
    });
  };
  
  const logMessage = (event, data) => {
    // 只记录特定事件
    const loggedEvents = ['connect', 'disconnect', 'join', 'leave'];
    if (loggedEvents.includes(event)) {
      console.log(`[WS] Event: ${event}`, {
        id: socket.id,
        userId: socket.userId,
        event,
        timestamp: new Date().toISOString()
      });
    }
  };
  
  socket.on('connect', logConnection);
  socket.on('disconnect', logDisconnection);
  socket.on('error', logError);
  
  // 添加消息日志（可选）
  const originalEmit = socket.emit;
  socket.emit = function(event, ...args) {
    logMessage(event, args.length > 0 ? args[0] : null);
    return originalEmit.apply(this, arguments);
  };
};

module.exports = function(loggerInstance) { return requestLogger; };
module.exports.requestLogger = requestLogger;
module.exports.accessLogger = accessLogger;
module.exports.websocketLogger = websocketLogger;
/**
 * 错误处理中间件
 * 统一处理所有错误
 */

const logger = require('../utils/logger');

/**
 * 错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const errorHandler = (err, req, res, next) => {
  // 设置默认错误状态码和信息
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || '服务器内部错误';
  
  // 记录错误日志
  logger.error('请求处理错误', {
    error: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.userId || 'anonymous',
    userAgent: req.get('User-Agent')
  });
  
  // 构造响应
  const response = {
    success: false,
    error: {
      message: message,
      code: err.code || 'INTERNAL_ERROR'
    }
  };
  
  // 仅在开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    response.error.details = err.stack;
    response.error.url = req.url;
    response.error.method = req.method;
    response.error.query = req.query;
    response.error.params = req.params;
    response.error.body = req.body;
  }
  
  // 针对特定错误类型的特殊处理
  switch (err.name) {
    case 'ValidationError':
      response.error.code = 'VALIDATION_ERROR';
      response.error.details = err.errors;
      return res.status(400).json(response);
    
    case 'CastError':
      response.error.code = 'INVALID_ID';
      response.error.message = `无效的ID格式: ${err.value}`;
      return res.status(400).json(response);
    
    case 'MongoError':
      if (err.code === 11000) {
        response.error.code = 'DUPLICATE_KEY';
        response.error.message = '数据重复';
        return res.status(409).json(response);
      }
      break;
    
    case 'JsonWebTokenError':
      response.error.code = 'INVALID_TOKEN';
      response.error.message = '无效的token';
      return res.status(401).json(response);
    
    case 'TokenExpiredError':
      response.error.code = 'TOKEN_EXPIRED';
      response.error.message = 'token已过期';
      return res.status(401).json(response);
  }
  
  // 检查自定义错误属性
  if (err.isOperational) {
    // 业务错误
    response.error.code = err.code || 'BUSINESS_ERROR';
    return res.status(statusCode).json(response);
  }
  
  // 默认500内部服务器错误
  if (statusCode === 500) {
    response.error.code = 'INTERNAL_SERVER_ERROR';
    // 生产环境下隐藏详细错误信息
    if (process.env.NODE_ENV === 'production') {
      response.error.message = '服务器内部错误';
    }
  }
  
  res.status(statusCode).json(response);
};

/**
 * 404错误处理器
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const notFoundHandler = (req, res, next) => {
  logger.warn('访问不存在的路由', {
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `找不到请求的资源: ${req.method} ${req.url}`
    }
  });
};

/**
 * 异步错误处理包装器
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装的中间件函数
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 创建自定义错误
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {string} code - 错误代码
 * @param {boolean} isOperational - 是否是操作性错误
 * @returns {Error} 错误对象
 */
const createError = (message, statusCode = 400, code = 'CUSTOM_ERROR', isOperational = true) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = isOperational;
  return error;
};

module.exports = function(loggerInstance) { return errorHandler; };
module.exports.errorHandler = errorHandler;
module.exports.notFoundHandler = notFoundHandler;
module.exports.asyncHandler = asyncHandler;
module.exports.createError = createError;
/**
 * 认证中间件
 * 验证JWT token
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * 验证JWT token
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const authenticateToken = (req, res, next) => {
  // 排除某些路径不需要认证
  const excludedPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/refresh',
    '/api/v1/health',
    '/socket.io/'
  ];
  
  if (excludedPaths.some(path => req.path.includes(path))) {
    return next();
  }
  
  // 从请求头获取token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;
  
  if (!token) {
    logger.warn('请求缺少认证token', {
      url: req.url,
      method: req.method,
      ip: req.ip
    });
    
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: '缺少认证token'
    });
  }
  
  // 验证token
  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        logger.warn('Token已过期', {
          url: req.url,
          userId: req.userId
        });
        
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: '认证token已过期'
        });
      }
      
      logger.error('Token验证失败', {
        error: err.message,
        url: req.url,
        ip: req.ip
      });
      
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: '无效的认证token'
      });
    }
    
    // 将解码的用户信息添加到请求对象
    req.user = decoded;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    logger.debug('Token验证成功', {
      userId: req.userId,
      role: req.userRole,
      url: req.url
    });
    
    next();
  });
};

/**
 * 验证用户角色
 * @param {Array} allowedRoles - 允许的角色列表
 * @returns {Function} 中间件函数
 */
const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    // 先验证token
    authenticateToken(req, res, () => {
      if (req.user) {
        const userRole = req.userRole || req.user.role;
        
        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
          logger.warn('用户角色无权访问', {
            userId: req.userId,
            userRole: userRole,
            requiredRoles: allowedRoles,
            url: req.url
          });
          
          return res.status(403).json({
            success: false,
            code: 'FORBIDDEN',
            message: '权限不足'
          });
        }
        
        next();
      }
    });
  };
};

/**
 * 可选的token验证 - 有token就验证，没有也不强制
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;
  
  if (!token) {
    // 没有token，继续执行
    return next();
  }
  
  // 验证token
  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      // token无效但也不阻止，继续执行
      logger.debug('可选token无效', {
        error: err.message,
        url: req.url
      });
      return next();
    }
    
    // 设置用户信息（兼容各种引用方式）
    req.user = decoded;
    req.user.id = decoded.userId;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  });
};

module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.authorizeRoles = authorizeRoles;
module.exports.optionalAuthenticate = optionalAuthenticate;
/**
 * 统一响应格式工具
 * @author Foodie Social Team
 */

/**
 * 成功响应
 * @param {Object} data - 响应数据
 * @param {string} message - 消息
 * @param {Object} meta - 元数据
 * @returns {Object} 格式化后的响应对象
 */
const success = (data = null, message = 'success', meta = {}) => {
  return {
    code: 200,
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  };
};

/**
 * 错误响应
 * @param {number} code - 错误码
 * @param {string} message - 错误消息
 * @param {Object} details - 错误详情
 * @returns {Object} 格式化后的错误响应对象
 */
const error = (code = 50000, message = '服务器内部错误', details = null) => {
  return {
    code,
    message,
    data: null,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * 分页响应
 * @param {Array} items - 数据项列表
 * @param {number} total - 总数
 * @param {number} page - 当前页
 * @param {number} limit - 每页数量
 * @param {string} message - 消息
 * @returns {Object} 格式化后的分页响应
 */
const paginated = (items = [], total = 0, page = 1, limit = 10, message = 'success') => {
  const totalPages = Math.ceil(total / limit);
  
  return success({
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }, message);
};

/**
 * 数据创建成功响应
 * @param {Object} data - 创建的数据
 * @param {string} message - 消息
 * @returns {Object} 格式化后的响应
 */
const created = (data = null, message = '创建成功') => {
  return success(data, message);
};

/**
 * 数据更新成功响应
 * @param {Object} data - 更新的数据
 * @param {string} message - 消息
 * @returns {Object} 格式化后的响应
 */
const updated = (data = null, message = '更新成功') => {
  return success(data, message);
};

/**
 * 数据删除成功响应
 * @param {string} message - 消息
 * @returns {Object} 格式化后的响应
 */
const deleted = (message = '删除成功') => {
  return success(null, message);
};

/**
 * 参数验证错误响应
 * @param {Array} errors - 验证错误数组
 * @param {string} message - 错误消息
 * @returns {Object} 格式化后的错误响应
 */
const validationError = (errors = [], message = '参数验证失败') => {
  return error(40001, message, { errors });
};

/**
 * 认证失败响应
 * @param {string} message - 错误消息
 * @returns {Object} 格式化后的错误响应
 */
const authError = (message = '认证失败') => {
  return error(40002, message);
};

/**
 * 权限不足响应
 * @param {string} message - 错误消息
 * @returns {Object} 格式化后的错误响应
 */
const forbiddenError = (message = '权限不足') => {
  return error(40003, message);
};

/**
 * 资源不存在响应
 * @param {string} message - 错误消息
 * @returns {Object} 格式化后的错误响应
 */
const notFoundError = (message = '资源不存在') => {
  return error(40004, message);
};

/**
 * 操作失败响应
 * @param {string} message - 错误消息
 * @returns {Object} 格式化后的错误响应
 */
const operationError = (message = '操作失败') => {
  return error(40005, message);
};

/**
 * 频率限制响应
 * @param {string} message - 错误消息
 * @returns {Object} 格式化后的错误响应
 */
const rateLimitError = (message = '请求过于频繁，请稍后再试') => {
  return error(40006, message);
};

/**
 * 用户已存在响应
 * @param {string} message - 错误消息
 * @returns {Object} 格式化后的错误响应
 */
const conflictError = (message = '用户已存在') => {
  return error(40007, message);
};

module.exports = {
  success,
  error,
  paginated,
  created,
  updated,
  deleted,
  validationError,
  authError,
  forbiddenError,
  notFoundError,
  operationError,
  rateLimitError,
  conflictError
};
/**
 * 异步处理中间件封装
 * 统一处理Promise中的错误，避免try/catch重复代码
 *
 * @param {Function} fn - 异步处理函数
 * @returns {Function} Express中间件函数
 *
 * 使用示例:
 * router.get('/example', asyncHandler(async (req, res) => {
 *   // 异步操作，无需try/catch
 *   const result = await someAsyncOperation();
 *   res.json(result);
 * }));
 */

function asyncHandler(fn) {
  return function asyncUtilWrap(req, res, next, ...args) {
    // 将fn返回的Promise链交给Express错误处理
    Promise.resolve(fn(req, res, next, ...args)).catch(next);
  };
}

module.exports = asyncHandler;
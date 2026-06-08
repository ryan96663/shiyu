/**
 * JWT配置
 */

module.exports = {
  // JWT密钥 - 从环境变量获取，或使用默认值（仅用于开发）
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  
  // 访问令牌过期时间
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
  
  // 刷新令牌过期时间
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // 令牌签发者
  JWT_ISSUER: process.env.JWT_ISSUER || 'foodie-social-api',
  
  // 令牌受众
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'foodie-social-users'
};
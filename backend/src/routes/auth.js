/**
 * 用户认证路由
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const axios = require('axios');

// 模拟用户数据库
const mockUsers = new Map();
let userIdCounter = 1000;

/**
 * POST /api/v1/auth/login
 * 微信登录
 */
router.post('/login', async (req, res) => {
  try {
    const { code, platform = 'wechat' } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '缺少微信登录code'
        }
      });
    }
    
    logger.info('处理微信登录请求', { platform, hasCode: !!code });
    
    // 调用微信API换取openid (Mock实现)
    let openid;
    try {
      // 实际实现中会调用微信API
      // const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      //   params: {
      //     appid: config.WECHAT_APP_ID,
      //     secret: config.WECHAT_APP_SECRET,
      //     js_code: code,
      //     grant_type: 'authorization_code'
      //   }
      // });
      // 
      // if (wxResponse.data.errcode) {
      //   throw new Error(`微信API错误: ${wxResponse.data.errmsg}`);
      // }
      // 
      // openid = wxResponse.data.openid;
      
      // Mock openid生成
      openid = `mock_openid_${code.slice(0, 8)}_${Date.now()}`;
      
      logger.info('获取openid成功', { openid });
    } catch (error) {
      logger.error('微信API调用失败', { error: error.message, code });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'WECHAT_AUTH_FAILED',
          message: '微信认证失败，请重试'
        }
      });
    }
    
    // 查找或创建用户
    let user;
    if (mockUsers.has(openid)) {
      user = mockUsers.get(openid);
      logger.info('用户已存在，更新登录时间', { userId: user.id });
    } else {
      // 创建新用户
      userIdCounter++;
      user = {
        id: userIdCounter.toString(),
        openid,
        nickname: `用户${userIdCounter}`,
        avatar: `https://via.placeholder.com/100x100/ff6b35/ffffff?text=U${userIdCounter}`,
        role: 'customer',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          anonymousDefault: false,
          notifications: true
        },
        statistics: {
          groupsJoined: 0,
          bottlesSent: 0,
          reviewsGiven: 0
        }
      };
      
      mockUsers.set(openid, user);
      logger.info('创建新用户成功', { userId: user.id });
    }
    
    // 更新最后登录时间
    user.lastLoginAt = new Date().toISOString();
    
    // 生成JWT token
    const tokenPayload = {
      userId: user.id,
      role: user.role,
      platform
    };
    
    const token = jwt.sign(tokenPayload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN || '24h'
    });
    
    // 生成refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      config.JWT_REFRESH_SECRET || config.JWT_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    // 存储refresh token (在实际应用中会存储到数据库)
    user.refreshToken = refreshToken;
    
    logger.info('生成Token成功', { userId: user.id, tokenLength: token.length });
    
    // 返回登录结果
    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.role,
          preferences: user.preferences
        },
        expiresIn: config.JWT_EXPIRES_IN || '24h'
      }
    });
    
  } catch (error) {
    logger.error('登录处理失败', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误，请稍后重试'
      }
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * 刷新token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '缺少refresh token'
        }
      });
    }
    
    logger.info('处理token刷新请求');
    
    // 验证refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET || config.JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new Error('无效的refresh token类型');
      }
      
      logger.info('Refresh token验证成功', { userId: decoded.userId });
    } catch (error) {
      logger.warn('Refresh token验证失败', { error: error.message });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token无效或已过期'
        }
      });
    }
    
    // 查找用户
    const user = Array.from(mockUsers.values()).find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }
    
    // 验证refresh token是否匹配（在实际应用中需要检查存储的token）
    if (user.refreshToken !== refreshToken) {
      logger.warn('Refresh token不匹配', { userId: user.id });
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_MISMATCH',
          message: 'Refresh token已失效'
        }
      });
    }
    
    // 生成新的access token
    const tokenPayload = {
      userId: user.id,
      role: user.role
    };
    
    const newToken = jwt.sign(tokenPayload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN || '24h'
    });
    
    // 生成新的refresh token
    const newRefreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      config.JWT_REFRESH_SECRET || config.JWT_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    // 更新用户refresh token
    user.refreshToken = newRefreshToken;
    
    logger.info('Token刷新成功', { userId: user.id });
    
    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: config.JWT_EXPIRES_IN || '24h'
      }
    });
    
  } catch (error) {
    logger.error('Token刷新失败', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * 退出登录
 */
router.post('/logout', async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: '需要认证'
        }
      });
    }
    
    logger.info('处理退出登录请求', { userId });
    
    // 查找并清除用户的refresh token
    const user = Array.from(mockUsers.values()).find(u => u.id === userId);
    if (user) {
      user.refreshToken = null;
      logger.info('用户refresh token已清除', { userId });
    }
    
    // 在实际应用中，可能还需要黑名单处理当前token
    
    res.json({
      success: true,
      data: {
        message: '退出登录成功'
      }
    });
    
  } catch (error) {
    logger.error('退出登录失败', { 
      error: error.message, 
      stack: error.stack,
      userId: req.userId 
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
});

module.exports = router;
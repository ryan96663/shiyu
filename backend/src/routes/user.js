/**
 * 用户管理路由
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Joi = require('express-validator');
const { body } = require('express-validator');

// Mock用户数据存储
let userProfiles = {
  // 这里可以连接到真实的数据库
};

/**
 * GET /api/user/profile
 * 获取用户信息
 */
router.get('/profile', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // 尝试从存储中获取用户信息
    let userProfile = userProfiles[userId];
    
    // 如果用户信息不存在，创建默认信息
    if (!userProfile) {
      userProfile = {
        id: userId,
        displayName: req.user.displayName || '未命名用户',
        email: req.user.email || '',
        area: req.user.area || '未知地区',
        avatar: req.user.avatar || '/assets/default-avatar.png',
        joinDate: req.user.joinDate || new Date().toISOString(),
        bio: '',
        preferences: {
          notifications: true,
          theme: 'light'
        }
      };
      userProfiles[userId] = userProfile;
    }

    res.json({
      success: true,
      message: '获取用户信息成功',
      data: userProfile
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/user/profile
 * 更新用户信息
 */
router.put('/profile', auth, [
  body('displayName').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('昵称长度必须在1-50字符之间'),
  body('bio').optional().isString().trim().isLength({ max: 200 }).withMessage('个人简介不能超过200字'),
  body('area').optional().isString().trim().isLength({ max: 50 }).withMessage('地区信息不能超过50字'),
  body('preferences').optional().isObject().withMessage('偏好设置必须是对象')
], async (req, res, next) => {
  try {
    // 验证输入
    const errors = await Joi.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { displayName, bio, area, preferences } = req.body;
    
    // 获取现有用户信息
    let userProfile = userProfiles[userId] || {
      id: userId,
      displayName: req.user.displayName || '未命名用户',
      email: req.user.email || '',
      area: req.user.area || '未知地区',
      avatar: req.user.avatar || '/assets/default-avatar.png',
      joinDate: req.user.joinDate || new Date().toISOString(),
      bio: '',
      preferences: {
        notifications: true,
        theme: 'light'
      }
    };

    // 更新用户信息
    if (displayName) userProfile.displayName = displayName;
    if (bio !== undefined) userProfile.bio = bio;
    if (area) userProfile.area = area;
    if (preferences) {
      userProfile.preferences = {
        ...userProfile.preferences,
        ...preferences
      };
    }

    userProfile.updatedAt = new Date().toISOString();
    userProfiles[userId] = userProfile;

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: userProfile
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/stats
 * 获取用户统计信息
 */
router.get('/stats', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // 这里可以连接真实的评价、漂流瓶等统计
    const stats = {
      reviews: Math.floor(Math.random() * 20) + 1, // 模拟数据
      receivedReviews: Math.floor(Math.random() * 30) + 1,
      averageRating: (Math.random() * 5).toFixed(1),
      bottlesThrown: Math.floor(Math.random() * 10) + 1,
      bottlesPicked: Math.floor(Math.random() * 15) + 1,
      totalLikes: Math.floor(Math.random() * 50) + 1,
      groupsJoined: Math.floor(Math.random() * 5) + 1,
      friendsCount: Math.floor(Math.random() * 20) + 1
    };

    res.json({
      success: true,
      message: '获取用户统计成功',
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/reviews
 * 获取用户的评价列表
 */
router.get('/reviews', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // 模拟用户评价数据
    const mockReviews = [
      {
        id: 'review_1',
        targetType: 'user',
        targetId: 'user_2',
        rating: 5,
        content: '很好的交流体验，很友善的用户',
        tags: ['友善', '有趣'],
        createdAt: new Date().toISOString(),
        likes: 3
      },
      {
        id: 'review_2',
        targetType: 'store',
        targetId: 'store_1',
        rating: 4,
        content: '这个餐厅环境很不错，推荐大家来试试',
        tags: ['环境好', '推荐'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        likes: 5
      }
    ];

    res.json({
      success: true,
      message: '获取用户评价成功',
      data: {
        reviews: mockReviews,
        pagination: {
          page: 1,
          limit: 20,
          total: mockReviews.length,
          totalPages: 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
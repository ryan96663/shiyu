/**
 * 漂流瓶相关路由
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Joi = require('express-validator');
const { body } = require('express-validator');
const config = require('../config');
const geoUtils = require('../utils/geoUtils');

// 内存存储 - 在实际项目中应使用Redis/MongoDB
let bottleStore = {
  bottles: [],  // 存储所有漂流瓶
  userBottles: {},  // 存储用户相关漂流瓶
  replies: {}  // 存储漂流瓶回复
};

/**
 * 创建漂流瓶
 */
router.post('/throw', auth, [
  body('content').isString().trim().isLength({ min: 1, max: 200 }).withMessage('内容不能为空且最多200字'),
  body('question').isString().trim().isLength({ min: 1, max: 100 }).withMessage('问题不能为空且最多100字'),
  body('tags').optional().isArray().isLength({ max: 3 }).withMessage('标签数量不能超过3个'),
  body('area').isString().isLength({ min: 1, max: 50 }).withMessage('区域信息不能为空')
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

    const userId = req.userId || req.user.id;
    const { content, question, tags = [], area } = req.body;
    
    // 检查用户是否已有未回复的漂流瓶
    const userActiveBottles = (bottleStore.userBottles[userId] || [])
      .filter(bottleId => {
        const bottle = bottleStore.bottles.find(b => b.id === bottleId);
        return bottle && !bottle.isReplied && bottle.hasQuestion;
      });

    if (userActiveBottles.length > 0 && !bottleStore.bottles.find(b => b.id === userActiveBottles[0])?.isReplied) {
      // 用户有未回复的漂流瓶且包含问题，不允许再丢新的问题瓶
      const hasQuestionBottle = bottleStore.bottles.find(b => b.id === userActiveBottles[0] && b.hasQuestion);
      if (hasQuestionBottle) {
        return res.status(400).json({
          success: false,
          message: '您有未收到回复的漂流瓶，请先等待回复'
        });
      }
    }

    // 检查今日漂流瓶数量限制
    const today = new Date().toISOString().split('T')[0];
    const todayBottleCount = (bottleStore.userBottles[userId] || [])
      .filter(bottleId => {
        const bottle = bottleStore.bottles.find(b => b.id === bottleId);
        return bottle && bottle.createdAt.startsWith(today);
      }).length;

    if (todayBottleCount >= config.BOTTLE_DAILY_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `每日最多扔${config.BOTTLE_DAILY_LIMIT}个漂流瓶`
      });
    }

    // 创建漂流瓶
    const bottle = {
      id: `bottle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      authorName: req.user.displayName || '匿名用户',
      content,
      question,
      tags: tags.slice(0, 3),
      area,
      hasQuestion: Boolean(question && question.trim()),
      isReplied: false,
      recipientId: null,
      recipientName: null,
      replyContent: null,
      replyAt: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + config.BOTTLE_EXPIRE_HOURS * 60 * 60 * 1000).toISOString(),
      likes: 0,
      isAnonymous: true
    };

    // 存储漂流瓶
    bottleStore.bottles.push(bottle);
    
    if (!bottleStore.userBottles[userId]) {
      bottleStore.userBottles[userId] = [];
    }
    bottleStore.userBottles[userId].push(bottle.id);

    console.log(`用户 ${userId} 创建了漂流瓶: ${bottle.id}`);

    res.json({
      success: true,
      message: '漂流瓶已成功扔出',
      data: {
        bottleId: bottle.id,
        content: bottle.content,
        hasQuestion: bottle.hasQuestion,
        createdAt: bottle.createdAt,
        expiresAt: bottle.expiresAt
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 捞取漂流瓶(随机获取一个未回复的漂流瓶)
 */
router.post('/pick', auth, async (req, res, next) => {
  try {
    const userId = req.userId || req.user.id;
    const userArea = req.user.area || '未知地区';

    // 获取所有活跃的漂流瓶(未回复且未过期)
    const now = new Date();
    const activeBottles = bottleStore.bottles.filter(bottle => {
      const bottleExpireDate = new Date(bottle.expiresAt);
      const isNotExpired = bottleExpireDate > now;
      const hasNoRecipient = !bottle.recipientId;
      const notCreatedByCurrentUser = bottle.userId !== userId;
      
      return isNotExpired && hasNoRecipient && notCreatedByCurrentUser;
    });

    if (activeBottles.length === 0) {
      return res.json({
        success: false,
        message: '暂时没有漂流瓶可以捞取'
      });
    }

    // 优先捞取同地区的漂流瓶，如果没有则随机
    let pickedBottle = activeBottles.find(bottle => bottle.area === userArea);
    
    if (!pickedBottle) {
      // 随机捞取一个漂流瓶
      pickedBottle = activeBottles[Math.floor(Math.random() * activeBottles.length)];
    }

    // 更新漂流瓶状态
    pickedBottle.recipientId = userId;
    pickedBottle.recipientName = req.user.displayName || '匿名用户';
    pickedBottle.pickedAt = new Date().toISOString();

    // 如果有回复，则获取回复内容
    const reply = bottleStore.replies[pickedBottle.id];
    
    // 如果已有回复，更新漂流瓶状态
    if (reply) {
      pickedBottle.isReplied = true;
      pickedBottle.replyContent = reply.content;
      pickedBottle.replyAt = reply.createdAt;
    }

    console.log(`用户 ${userId} 捞取了漂流瓶: ${pickedBottle.id}`);

    res.json({
      success: true,
      message: '成功捞取漂流瓶',
      data: {
        bottleId: pickedBottle.id,
        content: pickedBottle.content,
        question: pickedBottle.question,
        hasQuestion: pickedBottle.hasQuestion,
        authorArea: pickedBottle.area,
        isAnonymous: pickedBottle.isAnonymous,
        createdAt: pickedBottle.createdAt,
        expiresAt: pickedBottle.expiresAt,
        replyContent: pickedBottle.replyContent,
        isReplied: pickedBottle.isReplied,
        pickedAt: pickedBottle.pickedAt
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 回复漂流瓶
 */
router.post('/:bottleId/reply', auth, [
  body('content').isString().trim().isLength({ min: 1, max: 200 }).withMessage('回复内容不能为空且最多200字')
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

    const userId = req.userId || req.user.id;
    const { bottleId } = req.params;
    const { content } = req.body;

    // 查找漂流瓶
    const bottle = bottleStore.bottles.find(b => b.id === bottleId);
    if (!bottle) {
      return res.status(404).json({
        success: false,
        message: '漂流瓶不存在'
      });
    }

    // 检查漂流瓶是否已被领取
    if (!bottle.recipientId) {
      return res.status(400).json({
        success: false,
        message: '漂流瓶尚未被领取'
      });
    }

    // 检查是否是该漂流瓶的持有者
    if (bottle.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: '您不是该漂流瓶的持有者'
      });
    }

    // 检查漂流瓶是否已回复
    if (bottle.isReplied) {
      return res.status(400).json({
        success: false,
        message: '漂流瓶已收到回复'
      });
    }

    // 创建回复
    const reply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bottleId,
      userId,
      userName: req.user.displayName || '匿名用户',
      content,
      createdAt: new Date().toISOString()
    };

    // 存储回复
    bottleStore.replies[bottleId] = reply;
    
    // 更新漂流瓶状态
    bottle.isReplied = true;
    bottle.replyContent = content;
    bottle.replyAt = new Date().toISOString();

    console.log(`用户 ${userId} 回复了漂流瓶: ${bottleId}`);

    res.json({
      success: true,
      message: '回复成功',
      data: {
        replyId: reply.id,
        content: reply.content,
        bottleId,
        createdAt: reply.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户的漂流瓶列表
 */
router.get('/list', auth, async (req, res, next) => {
  try {
    const userId = req.userId || req.user.id;
    const userBottleIds = bottleStore.userBottles[userId] || [];
    
    // 获取用户创建的所有漂流瓶
    const userBottles = userBottleIds
      .map(bottleId => bottleStore.bottles.find(b => b.id === bottleId))
      .filter(bottle => bottle && new Date(bottle.expiresAt) > new Date());

    // 获取用户捞取过的漂流瓶
    const pickedBottles = bottleStore.bottles.filter(bottle => 
      bottle.recipientId === userId && new Date(bottle.expiresAt) > new Date()
    );

    res.json({
      success: true,
      message: '获取漂流瓶列表成功',
      data: {
        thrown: userBottles.map(bottle => ({
          id: bottle.id,
          content: bottle.content,
          question: bottle.question,
          hasQuestion: bottle.hasQuestion,
          isReplied: bottle.isReplied,
          replyContent: bottle.replyContent,
          createdAt: bottle.createdAt,
          expiresAt: bottle.expiresAt
        })),
        picked: pickedBottles.map(bottle => ({
          id: bottle.id,
          content: bottle.content,
          question: bottle.question,
          hasQuestion: bottle.hasQuestion,
          isReplied: bottle.isReplied,
          replyContent: bottle.replyContent,
          pickedAt: bottle.pickedAt,
          expiresAt: bottle.expiresAt
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 点赞漂流瓶回复
 */
router.post('/:bottleId/like', auth, async (req, res, next) => {
  try {
    const userId = req.userId || req.user.id;
    const { bottleId } = req.params;

    // 查找漂流瓶
    const bottle = bottleStore.bottles.find(b => b.id === bottleId);
    if (!bottle) {
      return res.status(404).json({
        success: false,
        message: '漂流瓶不存在'
      });
    }

    // 只有漂流瓶创建者和回复者可以点赞
    if (bottle.userId !== userId && bottle.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: '您不是该漂流瓶的相关用户'
      });
    }

    // 点赞回复
    bottle.likes = (bottle.likes || 0) + 1;

    console.log(`漂流瓶 ${bottleId} 收到点赞，现在有 ${bottle.likes} 个赞`);

    res.json({
      success: true,
      message: '点赞成功',
      data: {
        likes: bottle.likes
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 获取漂流瓶统计
 */
router.get('/stats', auth, async (req, res, next) => {
  try {
    const userId = req.userId || req.user.id;
    const userBottleIds = bottleStore.userBottles[userId] || [];
    const now = new Date();

    // 计算统计信息
    const stats = {
      thrown: 0,
      picked: 0,
      replied: 0,
      active: 0,
      receivedLikes: 0
    };

    // 创建和回复的漂流瓶统计
    userBottleIds.forEach(bottleId => {
      const bottle = bottleStore.bottles.find(b => b.id === bottleId);
      if (bottle) {
        stats.thrown++;
        if (bottle.isReplied) {
          stats.replied++;
        }
        if (new Date(bottle.expiresAt) > now) {
          stats.active++;
        }
        stats.receivedLikes += bottle.likes || 0;
      }
    });

    // 捞取的漂流瓶统计
    const pickedBottles = bottleStore.bottles.filter(bottle => 
      bottle.recipientId === userId && new Date(bottle.expiresAt) > now
    );
    stats.picked = pickedBottles.length;

    res.json({
      success: true,
      message: '获取漂流瓶统计成功',
      data: stats
    });

  } catch (error) {
    next(error);
  }
});

// 导出主要路由
module.exports = router;
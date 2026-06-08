/**
 * 评价榜单相关路由
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Joi = require('express-validator');
const { body, query } = require('express-validator');
const config = require('../config');
const geoUtils = require('../utils/geoUtils');

// 内存存储 - 在实际项目中应使用MongoDB
let reviewStore = {
  reviews: [],  // 存储所有评价
  userReviews: {},  // 按用户分组的评价
  storeReviews: {},  // 按店铺分组的评价
  rankings: {}  // 榜单数据
};

/**
 * 更新榜单排名
 */
const updateRankings = (targetType, targetId) => {
  const period = 'weekly'; // 默认统计周榜
  const rankingKey = `${targetType}:${period}`;
  
  if (!reviewStore.rankings[rankingKey]) {
    reviewStore.rankings[rankingKey] = [];
  }

  // 获取该目标的所有评价
  const targetKey = `${targetType}:${targetId}`;
  const targetReviews = (reviewStore.storeReviews[targetKey] || [])
    .map(reviewId => reviewStore.reviews.find(r => r.id === reviewId))
    .filter(review => review);

  if (targetReviews.length === 0) return;

  // 计算统计信息
  const stats = {
    targetType,
    targetId,
    totalReviews: targetReviews.length,
    averageRating: targetReviews.reduce((sum, r) => sum + r.rating, 0) / targetReviews.length,
    totalLikes: targetReviews.reduce((sum, r) => sum + (r.likes || 0), 0),
    lastUpdated: new Date().toISOString()
  };

  // 更新或添加排名数据
  const existingIndex = reviewStore.rankings[rankingKey]
    .findIndex(r => r.targetType === targetType && r.targetId === targetId);
  
  if (existingIndex > -1) {
    reviewStore.rankings[rankingKey][existingIndex] = stats;
  } else {
    reviewStore.rankings[rankingKey].push(stats);
  }

  // 重新排序
  reviewStore.rankings[rankingKey].sort((a, b) => {
    // 首先按评分排序，然后按好评数量，最后按获赞数
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating;
    }
    if (b.totalReviews !== a.totalReviews) {
      return b.totalReviews - a.totalReviews;
    }
    return b.totalLikes - a.totalLikes;
  });
};

/**
 * 排序和分页评价数据
 */
const sortAndPaginateReviews = (reviews, sortBy, page, limit) => {
  // 排序
  switch (sortBy) {
    case 'oldest':
      reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'rating':
      reviews.sort((a, b) => b.rating - a.rating);
      break;
    case 'popularity':
      reviews.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      break;
    case 'newest':
    default:
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
  }

  // 分页
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const currentPage = reviews.slice(startIndex, endIndex);

  return {
    currentPage,
    total: reviews.length
  };
};

/**
 * 计算用户评价统计
 */
const calculateUserReviewStats = (reviews) => {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  
  const ratingDistribution = reviews.reduce((dist, review) => {
    dist[review.rating] = (dist[review.rating] || 0) + 1;
    return dist;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  return {
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution
  };
};

/**
 * 获取榜单数据
 */
const getRankings = (type, period, limit) => {
  const rankingKey = `${type}:${period}`;
  const rankings = reviewStore.rankings[rankingKey] || [];
  
  return rankings.slice(0, limit).map((item, index) => ({
    rank: index + 1,
    targetType: item.targetType,
    targetId: item.targetId,
    averageRating: item.averageRating,
    totalReviews: item.totalReviews,
    totalLikes: item.totalLikes,
    lastUpdated: item.lastUpdated
  }));
};

/**
 * 提交用户评价
 */
router.post('/submit', auth, [
  body('targetType').isIn(['user', 'store']).withMessage('目标类型必须是user或store'),
  body('targetId').isString().notEmpty().withMessage('目标ID不能为空'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('评分必须是1-5的整数'),
  body('content').isString().trim().isLength({ min: 1, max: 500 }).withMessage('评价内容不能为空且最多500字'),
  body('tags').optional().isArray().isLength({ max: 5 }).withMessage('标签数量不能超过5个'),
  body('images').optional().isArray().isLength({ max: 3 }).withMessage('图片数量不能超过3张')
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
    const { targetType, targetId, rating, content, tags = [], images = [] } = req.body;
    
    // 检查是否已评价过该目标
    const existingReview = reviewStore.reviews.find(review => 
      review.userId === userId && 
      review.targetType === targetType && 
      review.targetId === targetId
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: '您已经评价过该用户了'
      });
    }

    // 检查今日评价数量限制
    const today = new Date().toISOString().split('T')[0];
    const todayReviewCount = reviewStore.reviews.filter(review => 
      review.userId === userId && review.createdAt.startsWith(today)
    ).length;

    if (todayReviewCount >= config.REVIEW_DAILY_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `每人每日最多提交${config.REVIEW_DAILY_LIMIT}条评价`
      });
    }

    // 创建评价
    const review = {
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName: req.user.displayName || '匿名用户',
      targetType,
      targetId,
      rating,
      content,
      tags: tags.slice(0, 5),
      images: images.slice(0, 3),
      createdAt: new Date().toISOString(),
      likes: 0,
      isAnonymous: false
    };

    // 存储评价
    reviewStore.reviews.push(review);
    
    // 按用户分组
    if (!reviewStore.userReviews[userId]) {
      reviewStore.userReviews[userId] = [];
    }
    reviewStore.userReviews[userId].push(review.id);

    // 按目标分组
    const targetKey = `${targetType}:${targetId}`;
    if (!reviewStore.storeReviews[targetKey]) {
      reviewStore.storeReviews[targetKey] = [];
    }
    reviewStore.storeReviews[targetKey].push(review.id);

    // 更新榜单排名
    updateRankings(targetType, targetId);

    console.log(`用户 ${userId} 提交了${targetType}评价: ${review.id}`);

    res.json({
      success: true,
      message: '评价提交成功',
      data: {
        reviewId: review.id,
        rating: review.rating,
        createdAt: review.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户评价列表
 */
router.get('/user/:userId', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('sortBy').optional().isIn(['newest', 'oldest', 'rating', 'popularity']).withMessage('排序参数无效')
], async (req, res, next) => {
  try {
    // 验证查询参数
    const errors = await Joi.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '查询参数验证失败',
        errors: errors.array()
      });
    }

    const targetUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'newest';

    // 获取该用户的评价（别人对他的评价）
    const userReviewIds = reviewStore.userReviews[targetUserId] || [];
    let reviews = userReviewIds
      .map(reviewId => reviewStore.reviews.find(r => r.id === reviewId))
      .filter(review => review);

    // 分页和排序
    reviews = sortAndPaginateReviews(reviews, sortBy, page, limit);

    // 计算评分统计
    const stats = calculateUserReviewStats(reviews.currentPage);

    res.json({
      success: true,
      message: '获取用户评价成功',
      data: {
        reviews: reviews.currentPage,
        stats,
        pagination: {
          page,
          limit,
          total: reviews.total,
          totalPages: Math.ceil(reviews.total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 获取店铺评价列表
 */
router.get('/store/:storeId', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('sortBy').optional().isIn(['newest', 'oldest', 'rating', 'popularity']).withMessage('排序参数无效')
], async (req, res, next) => {
  try {
    // 验证查询参数
    const errors = await Joi.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '查询参数验证失败',
        errors: errors.array()
      });
    }

    const storeId = req.params.storeId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'newest';

    // 获取店铺评价
    const targetKey = `store:${storeId}`;
    const storeReviewIds = reviewStore.storeReviews[targetKey] || [];
    let reviews = storeReviewIds
      .map(reviewId => reviewStore.reviews.find(r => r.id === reviewId))
      .filter(review => review);

    // 分页和排序
    reviews = sortAndPaginateReviews(reviews, sortBy, page, limit);

    res.json({
      success: true,
      message: '获取店铺评价成功',
      data: {
        reviews: reviews.currentPage,
        pagination: {
          page,
          limit,
          total: reviews.total,
          totalPages: Math.ceil(reviews.total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 获取人气榜单
 */
router.get('/rankings/:type', auth, [
  query('period').optional().isIn(['daily', 'weekly', 'monthly', 'all']).withMessage('统计周期无效'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('显示数量必须在1-100之间')
], async (req, res, next) => {
  try {
    const type = req.params.type; // 'users' | 'stores'
    const period = req.query.period || 'weekly';
    const limit = parseInt(req.query.limit) || 50;

    if (!['users', 'stores'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '榜单类型必须是users或stores'
      });
    }

    // 获取榜单数据
    const rankings = getRankings(type, period, limit);

    res.json({
      success: true,
      message: '获取榜单成功',
      data: {
        type,
        period,
        rankings: rankings.slice(0, limit),
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 点赞评价
 */
router.post('/:reviewId/like', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;

    // 查找评价
    const review = reviewStore.reviews.find(r => r.id === reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评价不存在'
      });
    }

    // 检查是否已点赞
    const likedKey = `liked_${userId}`;
    if (review[likedKey]) {
      return res.status(400).json({
        success: false,
        message: '您已经点过赞了'
      });
    }

    // 点赞
    review.likes = (review.likes || 0) + 1;
    review[likedKey] = true;

    console.log(`用户 ${userId} 点赞了评价: ${reviewId}`);

    res.json({
      success: true,
      message: '点赞成功',
      data: {
        likes: review.likes
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * 删除评价
 */
router.delete('/:reviewId', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;

    // 查找评价
    const review = reviewStore.reviews.find(r => r.id === reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '评价不存在'
      });
    }

    // 检查权限
    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '您只能删除自己的评价'
      });
    }

    // 删除评价
    const index = reviewStore.reviews.findIndex(r => r.id === reviewId);
    if (index > -1) {
      reviewStore.reviews.splice(index, 1);
    }

    // 清理分组数据
    if (reviewStore.userReviews[userId]) {
      const reviewIndex = reviewStore.userReviews[userId].indexOf(reviewId);
      if (reviewIndex > -1) {
        reviewStore.userReviews[userId].splice(reviewIndex, 1);
      }
    }

    console.log(`用户 ${userId} 删除了评价: ${reviewId}`);

    res.json({
      success: true,
      message: '评价删除成功'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
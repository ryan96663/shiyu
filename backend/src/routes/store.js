/**
 * 店铺相关路由
 */

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const config = require('../config');
const { calculateDistance, isInRange } = require('../utils/geoUtils');

const router = express.Router();

/**
 * GET /api/v1/store/search
 * 店铺搜索
 */
/**
 * GET /api/v1/store/search
 * 店铺搜索（支持关键词和地理位置搜索）
 */
router.get('/search', asyncHandler(async (req, res) => {
  try {
    const {
      keyword = '',
      latitude,
      longitude,
      radius = 5000, // 默认5公里
      page = 1,
      limit = 20
    } = req.query;

    logger.info('店铺搜索请求', {
      keyword,
      latitude,
      longitude,
      radius,
      page,
      limit
    });

    // 基于配置的模拟数据搜索
    const stores = Object.values(config.STORES);
    let filteredStores = stores;

    // 关键词筛选
    if (keyword) {
      filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(keyword.toLowerCase()) ||
        store.address.includes(keyword)
      );
    }

    // 位置筛选
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      filteredStores = filteredStores.filter(store => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          store.latitude,
          store.longitude
        );
        return distance <= radius;
      });

      // 按距离排序
      filteredStores.sort((a, b) => {
        const distanceA = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          a.latitude,
          a.longitude
        );
        const distanceB = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          b.latitude,
          b.longitude
        );
        return distanceA - distanceB;
      });
    }

    // 分页
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const paginatedStores = filteredStores.slice(startIdx, endIdx);

    // 增强店铺信息
    const enhancedStores = paginatedStores.map(store => ({
      ...store,
      distance: latitude && longitude ? calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        store.latitude,
        store.longitude
      ) : null,
      onlineCount: Math.floor(Math.random() * 25) + 1, // 1-25人随机
      rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5分随机
      imageUrl: `https://picsum.photos/300/200?random=${store.id}`,
      tags: ['美食', '聚餐', '特色菜'].slice(0, Math.floor(Math.random() * 3) + 1)
    }));

    logger.info('店铺搜索完成', {
      total: filteredStores.length,
      returned: enhancedStores.length,
      keyword,
      page
    });

    res.json({
      success: true,
      data: {
        stores: enhancedStores,
        pagination: {
          current: page,
          limit: limit,
          total: filteredStores.length,
          totalPages: Math.ceil(filteredStores.length / limit)
        }
      }
    });

  } catch (error) {
    logger.error('店铺搜索失败', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: '店铺搜索失败'
      }
    });
  }
}));

/**
 * GET /api/v1/store/{store_id}
 * 获取店铺详情
 */
router.get('/:storeId', async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      module: 'store',
      endpoint: 'detail',
      action: '获取店铺详情 - 等待实现',
      storeId: req.params.storeId
    }
  });
});

/**
 * POST /api/v1/store/location/verify
 * 位置验证（GPS + WiFi）
 */
router.post('/location/verify', asyncHandler(async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      accuracy, 
      storeId,
      wifiSsid, 
      wifiBssid 
    } = req.body;

    // 参数验证
    if (!latitude || !longitude || !storeId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: '缺少必要的定位参数'
        }
      });
    }

    logger.info('位置验证请求', {
      userId: req.userId,
      storeId,
      latitude,
      longitude,
      wifiInfo: wifiSsid ? 'provided' : 'not provided'
    });

    // 计算用户与店铺的距离 (Haversine公式)
    const distance = calculateDistance(
      latitude, 
      longitude, 
      config.STORES?.[storeId]?.latitude || 39.9042, // 默认为北京坐标
      config.STORES?.[storeId]?.longitude || 116.4074
    );

    logger.info('距离计算结果', { distance, storeId, userId: req.userId });

    // GPS精度检查
    const gpsValid = !accuracy || accuracy <= 10; // 精度在10米以内
    
    // 距离检查
    const isInRange = distance <= 50; // 在50米范围内

    // WiFi验证 (如果提供了WiFi信息)
    let wifiValid = false;
    if (wifiSsid && wifiBssid) {
      const storeWifi = config.STORES?.[storeId]?.wifi;
      if (storeWifi) {
        wifiValid = (wifiSsid === storeWifi.ssid && wifiBssid === storeWifi.bssid);
      }
    } else {
      // 如果没有提供WiFi信息，模拟WiFi验证通过
      wifiValid = Math.random() > 0.3; // 70%概率通过
    }

    // 综合验证结果
    const verified = gpsValid && isInRange && wifiValid;
    const isInside = distance <= 30; // 在30米内算真正进店

    const result = {
      verified,
      isInside,
      distance: Math.round(distance * 100) / 100, // 保留2位小数
      gpsValid,
      isInRange,
      wifiValid,
      accuracy: accuracy || 0,
      storeLocation: {
        latitude: config.STORES?.[storeId]?.latitude,
        longitude: config.STORES?.[storeId]?.longitude
      }
    };

    logger.info('位置验证完成', {
      userId: req.userId,
      storeId,
      verified,
      distance: result.distance
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('位置验证失败', {
      error: error.message,
      stack: error.stack,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '位置验证服务异常'
      }
    });
  }
}));

/**
 * POST /api/v1/store/order/verify
 * 订单验证（美团核销）
 */
router.post('/order/verify', asyncHandler(async (req, res) => {
  try {
    const { orderId, verificationCode, storeId } = req.body;

    // 参数验证
    if (!orderId || !verificationCode || !storeId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: '缺少必要的订单验证参数'
        }
      });
    }

    logger.info('订单验证请求', {
      userId: req.userId,
      orderId,
      storeId
    });

    try {
      // 模拟美团OpenAPI调用
      // const response = await axios.post('https://openapi.meituan.com/order/verify', {
      //   order_id: orderId,
      //   verification_code: verificationCode,
      //   store_id: storeId
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${config.MEITUAN_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      // Mock验证逻辑
      const isValidOrder = orderId.length >= 8 && verificationCode.length >= 4;
      const isCorrectStore = Math.random() > 0.2; // 80%概率通过
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      if (isValidOrder && isCorrectStore) {
        const orderInfo = {
          orderId,
          storeId,
          storeName: config.STORES?.[storeId]?.name || '示例餐厅',
          amount: (Math.random() * 200 + 30).toFixed(2), // 30-230元随机
          orderTime: new Date(Date.now() - Math.random() * 3600000).toISOString(), // 1小时内
          dishes: [
            { name: '招牌菜', price: 58 },
            { name: '特色小食', price: 28 }
          ]
        };

        logger.info('订单验证成功', {
          userId: req.userId,
          orderId,
          storeId
        });

        res.json({
          success: true,
          data: {
            verified: true,
            orderInfo
          }
        });
      } else {
        logger.warn('订单验证失败', {
          userId: req.userId,
          orderId,
          reason: '订单信息不匹配'
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'ORDER_VERIFICATION_FAILED',
            message: '订单验证失败，请检查订单号和核销码'
          }
        });
      }
    } catch (error) {
      // API调用失败
      logger.error('订单验证API调用失败', {
        error: error.message,
        userId: req.userId,
        orderId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'ORDER_API_ERROR',
          message: '订单验证服务暂时不可用，请稍后重试'
        }
      });
    }

  } catch (error) {
    logger.error('订单验证处理失败', {
      error: error.message,
      stack: error.stack,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '订单验证服务异常'
      }
    });
  }
}));

/**
 * GET /api/v1/store/{store_id}
 * 店铺详情
 */
router.get('/:storeId', asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;

    logger.info('店铺详情请求', { storeId, userId: req.userId });

    const store = config.STORES[storeId];

    if (!store) {
      logger.warn('店铺不存在', { storeId, userId: req.userId });
      return res.status(404).json({
        success: false,
        error: {
          code: 'STORE_NOT_FOUND',
          message: '店铺不存在'
        }
      });
    }

    // 模拟额外的店铺数据
    const storeDetails = {
      ...store,
      description: `${store.name}是一家提供美味佳肴的店铺，环境舒适，服务周到。`,
      openTime: '10:00-22:00',
      priceRange: '¥50-200/人',
      categories: ['中式', '快餐', '包间'],
      facilities: ['WiFi', '停车场', '包间', '儿童座椅'],
      onlineCount: Math.floor(Math.random() * 25) + 1, // 1-25人随机
      rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)), // 3.5-5分
      reviewCount: Math.floor(Math.random() * 500) + 50, // 50-550条评价
      images: [
        `https://picsum.photos/800/600?random=${storeId}1`,
        `https://picsum.photos/800/600?random=${storeId}2`,
        `https://picsum.photos/800/600?random=${storeId}3`
      ],
      sceneImageUrl: `https://picsum.photos/800/600?random=${storeId}&scenic=1`,
      availableTables: Math.floor(Math.random() * 20) + 5, // 5-25张桌子
      menuHighlights: [
        { name: '招牌菜', price: 58, rating: 4.8 },
        { name: '特色小食', price: 28, rating: 4.5 },
        { name: '经典套餐', price: 88, rating: 4.6 }
      ]
    };

    logger.info('店铺详情返回', {
      storeId,
      userId: req.userId,
      onlineCount: storeDetails.onlineCount,
      rating: storeDetails.rating
    });

    res.json({
      success: true,
      data: storeDetails
    });

  } catch (error) {
    logger.error('店铺详情获取失败', {
      error: error.message,
      stack: error.stack,
      storeId: req.params.storeId,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'STORE_DETAIL_ERROR',
        message: '店铺详情获取失败'
      }
    });
  }
}));

module.exports = router;
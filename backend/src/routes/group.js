/**
 * 群组相关路由
 */

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const config = require('../config');
const socketService = require('../services/socketService');

const router = express.Router();

/**
 * GET /api/v1/group/{store_id}/info
 * 群聊信息
 */
router.get('/:storeId/info', asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;

    logger.info('群聊信息请求', {
      storeId,
      userId: req.userId
    });

    // 获取群组的WebSocket在线用户
    const roomUsers = socketService.getRoomUsers(`group:${storeId}`);
    const onlineCount = roomUsers ? roomUsers.size : 0;

    // 检查当前用户是否已加入
    const currentUser = roomUsers?.find(user => user.userId === req.userId);

    const groupInfo = {
      storeId,
      canJoin: checkJoinConditions(storeId),
      onlineCount,
      isMember: !!currentUser,
      tableNumber: currentUser?.tableNumber || null,
      joinedAt: currentUser?.joinedAt || null,
      remainTime: currentUser ? calculateRemainTime(currentUser.joinedAt, currentUser.isInside) : null
    };

    logger.info('群聊信息返回', {
      storeId,
      userId: req.userId,
      onlineCount,
      isMember: groupInfo.isMember
    });

    res.json({
      success: true,
      data: groupInfo
    });

  } catch (error) {
    logger.error('群聊信息获取失败', {
      error: error.message,
      stack: error.stack,
      storeId: req.params.storeId,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'GROUP_INFO_ERROR',
        message: '群聊信息获取失败'
      }
    });
  }
}));

/**
 * POST /api/v1/group/{store_id}/join
 * 加入群聊（需要进行三重验证）
 */
router.post('/:storeId/join', asyncHandler(async (req, res) => {
  try {
    const { storeId } = req.params;
    const { 
      locationVerification, 
      orderVerification, 
      tableNumber
    } = req.body;

    logger.info('加入群聊请求', {
      storeId,
      userId: req.userId,
      hasLocationVerify: !!locationVerification,
      hasOrderVerify: !!orderVerification
    });

    // 三重验证检查
    if (!locationVerification?.verified) {
      logger.warn('位置验证失败', { storeId, userId: req.userId });
      return res.status(400).json({
        success: false,
        error: {
          code: 'LOCATION_VERIFICATION_FAILED',
          message: '位置验证失败，请在店铺50米范围内'
        }
      });
    }

    if (!orderVerification?.verified) {
      logger.warn('订单验证失败', { storeId, userId: req.userId });
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_VERIFICATION_FAILED',
          message: '订单验证失败，请提供有效的店铺订单'
        }
      });
    }

    // 防重复加入检查
    const existingUser = socketService.getUserRoomData(req.userId);
    if (existingUser && existingUser.storeId === storeId && existingUser.status === 'active') {
      logger.warn('重复加入尝试', { storeId, userId: req.userId });
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_IN_GROUP',
          message: '您已经在该群聊中'
        }
      });
    }

    // 分配桌号（如果未提供）
    const assignedTableNumber = tableNumber || generateTableNumber(storeId);
    const displayName = `${assignedTableNumber}号桌`;

    // 创建群组加入消息
    const joinData = {
      userId: req.userId,
      storeId,
      tableNumber: assignedTableNumber,
      displayName,
      isInside: locationVerification.isInside,
      joinedAt: new Date().toISOString()
    };

    // 如果用户还没有连接的socket，先存储到临时内存中
    socketService.addPendingUser(req.userId, joinData);

    logger.info('准备加入群聊 - 等待WebSocket连接', {
      storeId,
      userId: req.userId,
      tableNumber: assignedTableNumber,
      isInside: locationVerification.isInside
    });

    res.json({
      success: true,
      data: {
        storeId,
        tableNumber: assignedTableNumber,
        displayName,
        joinedAt: joinData.joinedAt,
        message: '已准备好加入群聊，请使用WebSocket连接到群聊'
      }
    });

  } catch (error) {
    logger.error('加入群聊失败', {
      error: error.message,
      stack: error.stack,
      storeId: req.params.storeId,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'GROUP_JOIN_ERROR',
        message: '加入群聊失败'
      }
    });
  }
}));

/**
 * POST /api/v1/group/{group_id}/leave
 * 离开群聊
 */
router.post('/:groupId/leave', asyncHandler(async (req, res) => {
  try {
    const { groupId } = req.params;
    const { isInside } = req.body;

    logger.info('离开群聊请求', {
      groupId,
      userId: req.userId,
      isInside
    });

    // 检查用户是否在群组中
    const userData = socketService.getUserRoomData(req.userId);
    if (!userData || userData.storeId !== groupId) {
      logger.warn('用户不在群组中', { groupId, userId: req.userId });
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_IN_GROUP',
          message: '您不在该群组中'
        }
      });
    }

    // 更新离开状态
    userData.isInside = isInside;
    userData.exitTime = new Date().toISOString();

    // 通过WebSocket发送离开事件
    socketService.leaveGroup(req.userId, groupId, isInside);

    logger.info('离开群聊成功', {
      groupId,
      userId: req.userId,
      isInside,
      exitTime: userData.exitTime
    });

    res.json({
      success: true,
      data: {
        message: '已离开群聊',
        exitTime: userData.exitTime
      }
    });

  } catch (error) {
    logger.error('离开群聊失败', {
      error: error.message,
      stack: error.stack,
      groupId: req.params.groupId,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'GROUP_LEAVE_ERROR',
        message: '离开群聊失败'
      }
    });
  }
}));

/**
 * GET /api/v1/group/{group_id}/messages
 * 群聊消息列表
 */
router.get('/:groupId/messages', asyncHandler(async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    logger.info('群聊消息请求', {
      groupId,
      userId: req.userId,
      page,
      limit
    });

    // 检查用户是否有权限查看群聊消息
    const userData = socketService.getUserRoomData(req.userId);
    const hasAccess = userData && userData.storeId === groupId && userData.status === 'active';

    if (!hasAccess) {
      logger.warn('无权限查看群聊消息', { groupId, userId: req.userId });
      return res.status(403).json({
        success: false,
        error: {
          code: 'NO_ACCESS',
          message: '您没有权限查看该群聊消息'
        }
      });
    }

    // 模拟消息列表（实际项目中从数据库获取）
    const mockMessages = generateMockMessages(groupId, parseInt(page), parseInt(limit));

    logger.info('群聊消息返回', {
      groupId,
      userId: req.userId,
      count: mockMessages.length,
      page
    });

    res.json({
      success: true,
      data: {
        messages: mockMessages,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total: 100, // 模拟总数
          totalPages: Math.ceil(100 / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('群聊消息获取失败', {
      error: error.message,
      stack: error.stack,
      groupId: req.params.groupId,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'MESSAGES_ERROR',
        message: '群聊消息获取失败'
      }
    });
  }
}));

/**
 * POST /api/v1/group/{group_id}/greeting
 * 随机打招呼
 */
router.post('/:groupId/greeting', asyncHandler(async (req, res) => {
  try {
    const { groupId } = req.params;

    logger.info('随机打招呼请求', {
      groupId,
      userId: req.userId
    });

    // 检查用户是否在群组中
    const userData = socketService.getUserRoomData(req.userId);
    if (!userData || userData.storeId !== groupId) {
      logger.warn('用户不在群组中', { groupId, userId: req.userId });
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_IN_GROUP',
          message: '您不在该群组中'
        }
      });
    }

    // 获取群组中其他在线用户
    const roomUsers = socketService.getRoomUsers(`group:${groupId}`);
    const otherUsers = roomUsers?.filter(user => user.userId !== req.userId) || [];

    if (otherUsers.length === 0) {
      logger.info('群组中无其他用户', { groupId, userId: req.userId });
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_OTHER_USERS',
          message: '群组中没有其他用户'
        }
      });
    }

    // 随机选择一个目标用户
    const targetUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
    const greetingMessage = generateGreetingMessage(userData.displayName, targetUser.displayName);

    // 通过WebSocket发送打招呼事件
    socketService.sendGreeting(req.userId, targetUser.userId, groupId, greetingMessage);

    logger.info('随机打招呼成功', {
      groupId,
      userId: req.userId,
      targetUserId: targetUser.userId,
      senderName: userData.displayName,
      targetName: targetUser.displayName
    });

    res.json({
      success: true,
      data: {
        targetUser: targetUser.displayName,
        message: greetingMessage,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('随机打招呼失败', {
      error: error.message,
      stack: error.stack,
      groupId: req.params.groupId,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'GREETING_ERROR',
        message: '打招呼失败'
      }
    });
  }
}));

// 辅助函数

/**
 * 检查加入条件
 */
function checkJoinConditions(storeId) {
  const store = config.STORES[storeId];
  // 模拟基本检查逻辑
  return {
    storeExists: !!store,
    withinBusinessHours: true
  };
}

/**
 * 生成桌号
 */
function generateTableNumber(storeId) {
  // 模拟桌号生成
  const tableNumber = Math.floor(Math.random() * 20) + 1;
  return tableNumber;
}

/**
 * 计算剩余时间
 */
function calculateRemainTime(joinedAt, isInside) {
  if (!joinedAt) return null;

  const joinedTime = new Date(joinedAt).getTime();
  const now = Date.now();
  const elapsed = now - joinedTime;

  if (isInside) {
    const maxDuration = config.GROUP.INSIDE_MAX_DURATION;
    return Math.max(0, maxDuration - elapsed);
  } else {
    // 需要检查exit_time，这里简化处理
    const maxDuration = config.GROUP.OUTSIDE_MAX_DURATION;
    return Math.max(0, maxDuration - elapsed);
  }
}

/**
 * 生成模拟消息
 */
function generateMockMessages(groupId, page, limit) {
  const messages = [];
  const offset = (page - 1) * limit;

  for (let i = 0; i < limit; i++) {
    const messageIndex = offset + i + 1;
    messages.push({
      id: `msg_${groupId}_${messageIndex}`,
      sender: `${Math.floor(Math.random() * 25) + 1}号桌`,
      content: getRandomMessage(),
      timestamp: new Date(Date.now() - (limit - i) * 60000).toISOString(),
      type: Math.random() > 0.8 ? 'review' : 'text',
      dishRating: Math.random() > 0.8 ? Math.floor(Math.random() * 5) + 1 : null
    });
  }

  return messages;
}

/**
 * 随机消息内容生成
 */
function getRandomMessage() {
  const messages = [
    '这家店的环境真不错！',
    '招牌菜推荐一下',
    '有人尝过这里的特色套餐吗？',
    '服务很好，菜品也新鲜',
    '位置很好找，就在建国路上',
    '价格还挺实惠的',
    'wifi密码是多少？',
    '这边停车位充足吗？'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * 生成打招呼消息
 */
function generateGreetingMessage(sender, target) {
  const greetings = [
    `你好，${target}！这里的招牌菜怎么样？`,
    `嗨，${target}！有什么推荐的菜品吗？`,
    '你好！请问这边 wifi 密码是多少？',
    `嗨，${target}！第一次来这家，环境不错呢`,
    '你好！有人一起拼桌吗？',
    `嘿，${target}！这边停车位好找吗？`
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

module.exports = router;
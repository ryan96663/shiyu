/**
 * AI服务相关路由
 * 由于采用Canvas前端Mock，这些接口仅作占位
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/v1/ai/generate-scene
 * 生成像素场景（Mock版本）
 */
router.post('/generate-scene', async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      module: 'ai',
      endpoint: 'generate-scene',
      action: 'AI场景生成 - Canvas前端渲染',
      message: '在实际实现中，此接口将调用AI服务，当前使用前端Canvas模拟',
      canvasData: {
        sceneId: 'mock_' + Date.now(),
        storeId: req.body.storeId,
        style: req.body.style || 'pixel_8bit',
        isMock: true
      }
    }
  });
});

/**
 * GET /api/v1/ai/styles
 * 获取可用的像素风格
 */
router.get('/styles', async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      module: 'ai',
      endpoint: 'styles',
      action: '获取AI风格列表',
      styles: [
        {
          id: 'pixel_8bit',
          name: '8位像素风格',
          description: '经典复古的8位像素游戏画面'
        },
        {
          id: 'pixel_16bit',
          name: '16位像素风格',
          description: '更细腻的16位像素艺术风格'
        },
        {
          id: 'retro',
          name: '复古风格',
          description: '模拟老式显示器的CRT效果'
        },
        {
          id: 'anime',
          name: '动漫风格',
          description: '日式动漫像素风格'
        }
      ]
    }
  });
});

/**
 * POST /api/v1/ai/analyze-content
 * 内容分析（Mock版本）
 */
router.post('/analyze-content', async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      module: 'ai',
      endpoint: 'analyze-content',
      action: '内容分析 - 使用关键词匹配',
      message: '在实际实现中，此接口将调用AI分析服务，当前使用简单的关键词匹配',
      analysis: {
        mock: true,
        sentiment: 'positive',
        keywords: ['示例', 'keysword', 'mock']
      }
    }
  });
});

module.exports = router;
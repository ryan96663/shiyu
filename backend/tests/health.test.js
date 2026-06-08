/**
 * Health检查测试
 * 验证基础API服务是否正常
 */

const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
  // 测试前准备
  beforeAll(() => {
    // 可以在这里添加测试前的准备工作
    console.log('[测试] 开始健康检查测试...');
  });
  
  // 测试后清理
  afterAll(async () => {
    // 可以在这里添加测试后的清理工作
    console.log('[测试] 健康检查测试完成');
  });
  
  // 基础健康检查测试
  test('GET /health 应该返回200和成功状态', async () => {
    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body).toBeDefined();
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.version).toBeDefined();
  });
  
  // API版本测试
  test('GET /api/v1/health 应该返回200', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Service is running');
  });
  
  // 不存在的路由测试
  test('GET /nonexistent 应该返回404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);
    
    expect(response.body).toBeDefined();
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

// 用于测试的辅助函数
const createTestApp = () => {
  const testApp = require('express')();
  
  // 添加基础中间件
  testApp.use(require('cors')());
  testApp.use(require('express').json());
  
  // 添加健康检查路由
  testApp.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: require('../package.json').version
    });
  });
  
  testApp.get('/api/v1/health', (req, res) => {
    res.json({
      success: true,
      message: 'Service is running',
      timestamp: new Date().toISOString()
    });
  });
  
  return testApp;
};

// 如果使用jest，可以在这里导出用于其他测试的app
module.exports = {
  createTestApp,
  app
};
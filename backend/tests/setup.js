/**
 * 测试环境设置
 */

const config = require('../src/config');

// 设置环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';

// 模拟Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    quit: jest.fn()
  }))
}));

// 模拟MongoDB
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  model: jest.fn(),
  connection: {
    close: jest.fn()
  }
}));

// 全局测试配置
global.testConfig = {
  API_BASE_URL: 'http://localhost:3001',
  JWT_SECRET: 'test-jwt-secret'
};

console.log('测试环境已配置:', {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: !!process.env.JWT_SECRET
});
/**
 * 等距场景集成适配层 — 连接等距引擎到 detail.js 页面生命周期
 */

const isoEngine = require('../../utils/iso-engine.js');
const isoCompositor = require('../../utils/iso-scene-compositor.js');

const IsoIntegration = {
  _canvas: null,
  _ctx: null,
  _initialized: false,
  _sceneParams: null,

  /**
   * 初始化（接收微信小程序 Canvas 2D node 和 context）
   */
  init(canvas, ctx) {
    this._canvas = canvas;
    this._ctx = ctx;
    isoEngine.init(canvas, ctx);
    this._initialized = true;
    console.log('✅ 等距引擎初始化完成');
  },

  /**
   * 设置视口
   */
  setViewport(logicalWidth, logicalHeight, dpr) {
    if (!this._initialized) return;
    isoEngine.setViewport(logicalWidth, logicalHeight, dpr);
  },

  /**
   * 渲染场景
   * @param {object} params - 场景参数
   */
  render(params) {
    if (!this._initialized) {
      console.warn('⚠️ IsoIntegration 未初始化');
      return;
    }

    this._sceneParams = params || this._getDefaultParams();
    isoCompositor.render(this._sceneParams);
    console.log('🎨 等距场景渲染完成:', this._sceneParams.restaurantType);
  },

  /**
   * 更新参数并重新渲染
   */
  updateParams(partialParams) {
    if (!this._initialized) return;

    this._sceneParams = Object.assign(
      this._sceneParams || this._getDefaultParams(),
      partialParams
    );
    isoCompositor.render(this._sceneParams);
  },

  /**
   * 更新餐厅类型（主题切换）
   */
  switchRestaurantType(type) {
    const validTypes = ['sichuan', 'cantonese', 'japanese', 'bbq'];
    if (!validTypes.includes(type)) {
      console.warn('无效的餐厅类型:', type);
      return;
    }
    this.updateParams({ restaurantType: type });
  },

  /**
   * 更新时间/天气
   */
  setTimeAndWeather(timeOfDay, weather) {
    this.updateParams({ timeOfDay, weather });
  },

  /**
   * 获取当前场景参数
   */
  getCurrentParams() {
    return this._sceneParams;
  },

  /**
   * 默认参数
   */
  _getDefaultParams() {
    return {
      restaurantType: 'sichuan',
      tableCount: 6,
      occupancy: [
        { tableId: 0, count: 2 },
        { tableId: 1, count: 1 },
        { tableId: 2, count: 3 },
        { tableId: 3, count: 2 },
        { tableId: 4, count: 1 },
        { tableId: 5, count: 2 }
      ],
      timeOfDay: 'day',
      weather: 'clear'
    };
  },

  /**
   * 清理
   */
  destroy() {
    this._canvas = null;
    this._ctx = null;
    this._initialized = false;
    this._sceneParams = null;
    console.log('🧹 IsoIntegration 已清理');
  }
};

module.exports = IsoIntegration;

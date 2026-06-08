/**
 * 店铺图片映射配置（v6.0）
 *
 * 命名规则：店铺名全拼小写（不含声调）+ .jpg
 * 存放路径：/images/mock/
 *
 * 新增店铺图片步骤：
 * 1. 将图片放入 frontend/images/mock/
 * 2. 在 STORE_NAME_TO_IMAGE 中添加一行映射
 * 3. 编译即可生效，无需改 WXML
 */

const STORE_NAME_TO_IMAGE = {
  '美味中餐厅': '/images/mock/meiweizhongcanting.jpg',
  '意式披萨店': '/images/mock/yishipisadian.jpg',
  '日式料理屋': '/images/mock/rishiliaoliwu.jpg',
};

/** 无匹配时的默认兜底图片 */
const DEFAULT_IMAGE = '/images/mock/meiweizhongcanting.jpg';

/**
 * 解析单条店铺记录的图片路径
 *
 * 优先级：
 *   1. store.image_url 已有值（来自后端 API）→ 原样返回
 *   2. 店名命中 STORE_NAME_TO_IMAGE 映射表  → 返回映射路径
 *   3. 都未匹配                                → 返回 DEFAULT_IMAGE
 *
 * @param {Object} store - 店铺对象 { name, image_url, ... }
 * @returns {string} 解析后的图片路径
 */
function resolveStoreImage(store) {
  // 后端 API 已返回有效图片地址，直接使用
  if (store.image_url && store.image_url.trim().length > 0) {
    return store.image_url;
  }
  // 按店名查找本地 mock 映射
  if (store.name && STORE_NAME_TO_IMAGE[store.name]) {
    return STORE_NAME_TO_IMAGE[store.name];
  }
  // 兜底
  return DEFAULT_IMAGE;
}

/**
 * 为店铺列表批量解析图片路径（纯函数，不修改原数组）
 *
 * @param {Object[]} stores - 店铺对象数组
 * @returns {Object[]} 新数组，每条记录的 image_url 已解析
 */
function resolveStoreImages(stores) {
  if (!stores || !stores.length) return [];
  return stores.map(store => ({
    ...store,
    image_url: resolveStoreImage(store)
  }));
}

module.exports = {
  STORE_NAME_TO_IMAGE,
  DEFAULT_IMAGE,
  resolveStoreImage,
  resolveStoreImages
};

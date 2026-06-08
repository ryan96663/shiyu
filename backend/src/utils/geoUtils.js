/**
 * 几何计算工具函数
 */

/**
 * 使用Haversine公式计算两点之间的距离
 * @param {number} lat1 - 点1纬度
 * @param {number} lon1 - 点1经度
 * @param {number} lat2 - 点2纬度
 * @param {number} lon2 - 点2经度
 * @returns {number} 距离（米）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return 0;
  }

  // 地球半径（米）
  const R = 6371000;

  // 将角度转换为弧度
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  // Haversine公式
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // 计算距离（米）
  const distance = R * c;

  return distance;
}

/**
 * 检查坐标是否在指定范围内
 * @param {number} targetLat - 目标纬度
 * @param {number} targetLon - 目标经度
 * @param {number} centerLat - 中心点纬度
 * @param {number} centerLon - 中心点经度
 * @param {number} radius - 半径（米）
 * @returns {boolean} 是否在范围内
 */
function isInRange(targetLat, targetLon, centerLat, centerLon, radius) {
  const distance = calculateDistance(targetLat, targetLon, centerLat, centerLon);
  return distance <= radius;
}

module.exports = {
  calculateDistance,
  isInRange
};
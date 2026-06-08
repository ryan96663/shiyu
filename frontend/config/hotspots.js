/**
 * v6.0 热区坐标配置
 *
 * 坐标体系：以背景图左上角为原点
 * 背景图尺寸：320 × 750 px
 * 所有值均为百分比（left/top/width/height 均为 %），相对背景图尺寸
 *
 * 餐桌热区：40×40px 的正方形，以给定的桌位坐标点为中心
 * 前台热区：矩形范围，直接使用给定的坐标范围
 *
 * 背景图更换时只需调整此文件，无需改动 WXML
 */

const HOTSPOTS = [
  // 前台（矩形区域：200<x<270, 185<y<251）
  { id: 'counter', left: 62.5, top: 24.7, width: 21.9, height: 8.8, label: '前台' },

  // 01~07号桌（每桌 40×40px 热区，以坐标点为中心）
  { id: 't01', left: 21.3, top: 32.0, width: 12.5, height: 5.3, label: '01号桌' },
  { id: 't02', left: 21.3, top: 42.7, width: 12.5, height: 5.3, label: '02号桌' },
  { id: 't03', left: 21.3, top: 53.3, width: 12.5, height: 5.3, label: '03号桌' },
  { id: 't04', left: 21.3, top: 64.0, width: 12.5, height: 5.3, label: '04号桌' },
  { id: 't05', left: 21.3, top: 74.7, width: 12.5, height: 5.3, label: '05号桌' },
  { id: 't06', left: 71.9, top: 66.7, width: 12.5, height: 5.3, label: '06号桌' },
  { id: 't07', left: 71.9, top: 76.0, width: 12.5, height: 5.3, label: '07号桌' },
];

module.exports = { HOTSPOTS };

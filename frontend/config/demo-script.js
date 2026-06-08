/**
 * Demo 场景对话脚本（v6.0）
 *
 * 场景 A：美味中餐厅 7 人群聊（菜品点评 + 陌生人社交；7号桌为空桌）
 * 场景 B：打招呼 — 旅游问路
 *
 * 数据结构：
 *   sec:  相对时间偏移秒数（从进店开始计算）
 *   type: 'group' | 'greeting_send' | 'greeting_reply'
 *   table: 桌号（群聊）| from/to（打招呼）
 *   name:  发言人称呼
 *   msg:   对话内容
 *   hotspot: 对应的热区 ID
 */

// ===== 桌号 → 热区映射 =====
const TABLE_HOTSPOT_MAP = {
  '2': 't01',
  '3': 't02',
  '4': 't04',   // 脚本2：打招呼游客
  '5': 't03',
  '8': 't05',
  '10': 't06',
  '11': 't02',  // 脚本2：打招呼本地人（复用 t02）
  '12': 't07',
  '15': 't01'   // 复用 t01（2号桌较少发言）
};

// ===== 场景 A：群聊剧本（65 条，5 分钟）=====
const GROUP_CHAT_SCRIPT = [
  // --- 第一幕：进群 & 问推荐（00:00~00:50）---
  { sec: 5,  table: '12', name: '强哥', hotspot: 't07', msg: '我跟你们说今天的水煮鱼绝了 那花椒油泼上去滋滋冒' },
  { sec: 10, table: '3',  name: '小敏', hotspot: 't02', msg: '真的！我刚想说！比上次好吃太多' },
  { sec: 15, table: '10', name: '小宇', hotspot: 't06', msg: '不好意思插一句 第一次来 有推荐吗 菜单看半天了' },
  { sec: 20, table: '8',  name: '陈姐', hotspot: 't05', msg: '回锅肉 我儿子平时不吃肥肉今天吃了三块' },
  { sec: 25, table: '3',  name: '小敏', hotspot: 't02', msg: '水煮牛肉！！我男朋友在拌第三碗饭了哈哈哈哈' },
  { sec: 30, table: '15', name: '大刘', hotspot: 't01', msg: '回锅肉油不油？在控脂…' },
  { sec: 35, table: '12', name: '强哥', hotspot: 't07', msg: '控脂你来吃川菜哈哈哈' },
  { sec: 40, table: '2',  name: '阿杰', hotspot: 't01', msg: '水煮牛肉多少钱 学生党' },
  { sec: 45, table: '8',  name: '陈姐', hotspot: 't05', msg: '38！量大 我俩菜一汤一百出头' },
  { sec: 50, table: '12', name: '强哥', hotspot: 't07', msg: '而且牛肉是鲜的不是冻的 一吃就知道' },

  // --- 第二幕：争相推荐（00:55~01:40）---
  { sec: 55, table: '10', name: '小宇', hotspot: 't06', msg: '所以牛肉＞鱼？' },
  { sec: 60, table: '12', name: '强哥', hotspot: 't07', msg: '牛肉。鱼肉冻的 牛肉当天宰。听我的' },
  { sec: 65, table: '5',  name: '阿凯', hotspot: 't03', msg: '实测 牛肉嫩度7/10 鱼片5/10' },
  { sec: 70, table: '15', name: '大刘', hotspot: 't01', msg: '有测评博主' },
  { sec: 75, table: '3',  name: '小敏', hotspot: 't02', msg: '但是！！小酥肉一定要点！！比海底捞的还好吃！' },
  { sec: 80, table: '10', name: '小宇', hotspot: 't06', msg: '行 水煮牛肉+小酥肉 信你们的' },
  { sec: 85, table: '12', name: '强哥', hotspot: 't07', msg: '加个炝炒莲白 解腻 隐藏菜单 菜单上没有' },
  { sec: 90, table: '8',  name: '陈姐', hotspot: 't05', msg: '莲白真的脆甜 不知道怎么炒的 回家复刻三次全翻车' },
  { sec: 95, table: '5',  name: '阿凯', hotspot: 't03', msg: '锅温不够 家用灶达不到' },
  { sec: 100, table: '3', name: '小敏', hotspot: 't02', msg: '程序员连炒菜都要分析hhhh' },

  // --- 第三幕：日常穿插 & 阿杰吐露情绪（01:45~02:25）---
  { sec: 105, table: '8',  name: '陈姐', hotspot: 't05', msg: '今天加班到八点才来的 差点回家泡面' },
  { sec: 110, table: '15', name: '大刘', hotspot: 't01', msg: '我也差点 但想想还是出来了 一个人在家太闷' },
  { sec: 115, table: '2',  name: '阿杰', hotspot: 't01', msg: '今天心情不好…上午被导师否了方案 快毕业了焦虑' },
  { sec: 120, table: '3',  name: '小敏', hotspot: 't02', msg: '没事的！吃顿好的心情会好！' },
  { sec: 125, table: '12', name: '强哥', hotspot: 't07', msg: '你看小宇吃第一口牛肉都快哭了' },
  { sec: 130, table: '10', name: '小宇', hotspot: 't06', msg: '真的太嫩了 这个嫩度不科学' },
  { sec: 135, table: '8',  name: '陈姐', hotspot: 't05', msg: '毕业季都是小事 过来人跟你讲 都会好的' },
  { sec: 140, table: '2',  name: '阿杰', hotspot: 't01', msg: '谢谢…其实就想找个没人认识的地方待会儿' },
  { sec: 145, table: '3',  name: '小敏', hotspot: 't02', msg: '巧了 在座的都是"没人认识的人"哈哈哈' },

  // --- 第四幕：小酥肉下线互动（02:30~03:15）---
  { sec: 150, table: '10', name: '小宇', hotspot: 't06', msg: '阿杰 我这边小酥肉还有半盘 来几个？一个人真吃不完' },
  { sec: 155, table: '2',  name: '阿杰', hotspot: 't01', msg: '啊不用不用太客气了' },
  { sec: 160, table: '10', name: '小宇', hotspot: 't06', msg: '别客气来来来 沾那个酱 绝了' },
  { sec: 165, table: '12', name: '强哥', hotspot: 't07', msg: '哟 线下奔现了' },
  { sec: 170, table: '3',  name: '小敏', hotspot: 't02', msg: '我也想被请客' },
  { sec: 185, table: '2',  name: '阿杰', hotspot: 't01', msg: '谢谢兄弟！那个酱真的好吃 心情一下好了' },
  { sec: 190, table: '10', name: '小宇', hotspot: 't06', msg: '不客气 一个人吃饭挺无聊的 有人蘸个酱都好' },
  { sec: 195, table: '15', name: '大刘', hotspot: 't01', msg: '"有人一起蘸个酱都好" 我记下来了' },

  // --- 第五幕：社交价值共鸣（03:20~03:55）---
  { sec: 200, table: '8',  name: '陈姐', hotspot: 't05', msg: '以前一个人吃饭觉得尴尬 今天群里聊了半顿饭' },
  { sec: 205, table: '15', name: '大刘', hotspot: 't01', msg: '我也是 今天手机都没打开' },
  { sec: 210, table: '12', name: '强哥', hotspot: 't07', msg: '所以我才常来 感觉不止是吃饭' },
  { sec: 215, table: '5',  name: '阿凯', hotspot: 't03', msg: '之前觉得餐馆社交很尬 现在觉得还行 有边界感' },
  { sec: 220, table: '3',  name: '小敏', hotspot: 't02', msg: '程序员说了"还行"=非常满意' },
  { sec: 225, table: '2',  name: '阿杰', hotspot: 't01', msg: '本来想吃完赶紧回去改论文 现在不想走了' },
  { sec: 230, table: '15', name: '大刘', hotspot: 't01', msg: '有些话反而能跟陌生人说 跟朋友反而不好开口' },
  { sec: 235, table: '8',  name: '陈姐', hotspot: 't05', msg: '懂的 群里都是最熟悉的陌生人' },

  // --- 第六幕：请客高潮（04:00~04:55）---
  { sec: 240, table: '2',  name: '阿杰', hotspot: 't01', msg: '不是…谁把我账结了？？刚叫服务员买单说结过了' },
  { sec: 245, table: '3',  name: '小敏', hotspot: 't02', msg: '？？？什么情况' },
  { sec: 250, table: '15', name: '大刘', hotspot: 't01', msg: '神秘人出现了' },
  { sec: 255, table: '12', name: '强哥', hotspot: 't07', msg: '我感觉我知道是谁 但我不说' },
  { sec: 260, table: '2',  name: '阿杰', hotspot: 't01', msg: '到底谁啊？？？' },
  { sec: 265, table: '10', name: '小宇', hotspot: 't06', msg: '是我。今天心情也不太好 帮人一把也开心了' },
  { sec: 270, table: '3',  name: '小敏', hotspot: 't02', msg: '我真的哭了' },
  { sec: 275, table: '8',  name: '陈姐', hotspot: 't05', msg: '天 今天是什么神仙局' },
  { sec: 280, table: '5',  name: '阿凯', hotspot: 't03', msg: '妈妈问我为什么在饭馆哭' },
  { sec: 285, table: '15', name: '大刘', hotspot: 't01', msg: '热量超标了 但是值炸了' },
  { sec: 290, table: '2',  name: '阿杰', hotspot: 't01', msg: '兄弟加个微信吧 下次我请你 必须的' },
  { sec: 295, table: '10', name: '小宇', hotspot: 't06', msg: '行啊 扫我' }
];

// ===== 场景 B：打招呼 — 旅游问路（转为群聊格式，两桌在群聊中对话）=====
const GREETING_SCRIPT = [
  { sec: 5,  table: '4',  name: '游客',   hotspot: 't04', msg: 'hello～不好意思打扰，我来北京旅游，请问故宫从这边怎么走方便呀？' },
  { sec: 10, table: '11', name: '本地人', hotspot: 't02', msg: '哈哈没事儿。故宫啊 你别直接走正门 人太多了' },
  { sec: 15, table: '4',  name: '游客',   hotspot: 't04', msg: '啊对！我就怕排队排到天荒地老' },
  { sec: 20, table: '11', name: '本地人', hotspot: 't02', msg: '你吃完从文化馆那边买票进去 穿过文化馆直接到故宫对面 能少走起码二十分钟' },
  { sec: 25, table: '4',  name: '游客',   hotspot: 't04', msg: '文化馆是哪个？我路痴 求详细说' },
  { sec: 30, table: '11', name: '本地人', hotspot: 't02', msg: '就这条路出去右拐 走不到三百米有个灰色楼 上面写着文化馆 进去买票 里面有个通道直接穿过去就到故宫午门对面了 不用跟大部队在正门排队' },
  { sec: 35, table: '4',  name: '游客',   hotspot: 't04', msg: '记下来了记下来了！！太感谢了 你是本地人吗 怎么这么熟' },
  { sec: 40, table: '11', name: '本地人', hotspot: 't02', msg: '是啊 住了快三十年了。周末没事就带娃到处转 这个路线基本都知道。你从外地来嘛 推荐你顺便去一下旁边的角楼 拍照巨好看 特别是下午三四点' },
  { sec: 45, table: '4',  name: '游客',   hotspot: 't04', msg: '好的！！！角楼记下来 我要拍那种小红书同款' },
  { sec: 50, table: '11', name: '本地人', hotspot: 't02', msg: '哈哈对 就那个。拍完穿过午门进去 建议先看钟表馆和珍宝馆 那个最值' },
  { sec: 55, table: '4',  name: '游客',   hotspot: 't04', msg: '你太贴心了 比小红书攻略还详细' },
  { sec: 60, table: '11', name: '本地人', hotspot: 't02', msg: '哈哈不客气 北京欢迎你～' },
  { sec: 65, table: '4',  name: '游客',   hotspot: 't04', msg: '谢谢吴彦祖！！！' },
  { sec: 70, table: '11', name: '本地人', hotspot: 't02', msg: '我可不是吴彦祖 吴彦祖在北京的话早就被发现了' },
  { sec: 75, table: '4',  name: '游客',   hotspot: 't04', msg: '哈哈哈 总之感谢！来之前觉得北京人可能有点冷漠 结果遇到的都好热情' },
  { sec: 80, table: '11', name: '本地人', hotspot: 't02', msg: '那就好 北京人就是嘴贫了点 心都热着呢 好好玩啊' }
];

// ===== 气泡文字默认限长（超过截断）=====
const BUBBLE_MAX_LEN = 28;

/** 截取气泡展示文本 */
function bubbleText(msg) {
  if (!msg) return '';
  return msg.length > BUBBLE_MAX_LEN ? msg.slice(0, BUBBLE_MAX_LEN) + '…' : msg;
}

// ===== 店铺 → 脚本路由 =====
/**
 * 根据店铺名返回对应的 Demo 脚本
 * @returns {{ groupChat: Array|null, greeting: Array|null }} | null
 */
function getStoreScript(storeName) {
  if (!storeName) return null;
  if (storeName.includes('美味中餐厅') || storeName.includes('美味')) {
    return { groupChat: GROUP_CHAT_SCRIPT };
  }
  if (storeName.includes('日式料理') || storeName.includes('日料')) {
    return { groupChat: GREETING_SCRIPT };  // 已转为群聊格式
  }
  return null; // 非 Demo 店铺
}

module.exports = {
  TABLE_HOTSPOT_MAP,
  GROUP_CHAT_SCRIPT,
  GREETING_SCRIPT,
  getStoreScript,
  bubbleText
};

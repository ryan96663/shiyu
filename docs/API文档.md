# 美食社交小程序 - API接口文档

## 版本信息
- 版本: v1.0.0
- 最后更新: 2026-06-07
- 基础URL: `/api/v1` (本地开发环境)
- 生产环境: `https://api.foodie-social.com/api/v1`

## 认证机制

所有API请求需要在Header中包含JWT Token：
```
Authorization: Bearer <your_jwt_token>
```

## 通用响应格式

所有API遵循标准响应格式：
```json
{
  "success": true/false,
  "data": {},           // 成功时的数据
  "error": {           // 失败时的错误信息
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

**成功响应示例**：
```json
{
  "success": true,
  "data": {
    "user": { "id": "123", "nickname": "测试用户" }
  }
}
```

**错误响应示例**：
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED", 
    "message": "认证失败"
  }
}
```

## 1. 认证接口

### 1.1 微信登录
```
POST /auth/login
```

**请求参数**
```json
{
  "code": "string",           // 微信登录code，必填
  "encrypted_data": "string", // 用户信息加密数据，选填
  "iv": "string"              // 解密向量，选填
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_string",
    "user": {
      "user_id": "u1234567890",
      "nickname": "美食达人",
      "avatar": "https://example.com/avatar.jpg",
      "level": 1,
      "created_at": "2026-05-31T10:00:00Z"
    }
  }
}
```

### 1.2 刷新Token
```
POST /auth/refresh
```

**请求参数**
```json
{
  "refresh_token": "string"   // 刷新token，必填
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "new_jwt_token",
    "refresh_token": "new_refresh_token"
  }
}
```

### 1.3 退出登录
```
POST /auth/logout
```

**响应示例**
```json
{
  "code": 200,
  "message": "退出登录成功",
  "data": null
}
```

## 2. 用户接口

### 2.1 获取用户信息
```
GET /user/profile
```

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user_id": "u1234567890",
    "nickname": "美食达人",
    "avatar": "https://example.com/avatar.jpg",
    "gender": 1,
    "age": 25,
    "level": 3,
    "preferences": {
      "notification": true,
      "anonymous": false
    },
    "statistics": {
      "groups_joined": 15,
      "bottles_sent": 8,
      "bottles_received": 12,
      "reviews_written": 23
    }
  }
}
```

### 2.2 更新用户信息
```
PUT /user/profile
```

**请求参数**
```json
{
  "nickname": "string",       // 昵称，选填
  "avatar": "string",         // 头像URL，选填
  "preferences": {            // 偏好设置，选填
    "notification": true,
    "anonymous": false
  }
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": null
}
```

## 3. 店铺接口

### 3.1 获取店铺信息
```
GET /store/{store_id}
```

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "store_id": "s123456",
    "name": "川味火锅店",
    "address": "北京市朝阳区xxx路xxx号",
    "location": {
      "lng": 116.4074,
      "lat": 39.9042
    },
    "table_count": 25,
    "image_url": "https://cdn.example.com/store_original.jpg",
    "ai_image_url": "https://cdn.example.com/store_ai_generated.jpg",
    "status": 1,
    "rating": 4.5,
    "total_reviews": 128
  }
}
```

### 3.2 搜索店铺
```
GET /store/search
```

**查询参数**
- `keyword`: string - 搜索关键词，选填
- `lng`: number - 经度，选填
- `lat`: number - 纬度，选填
- `radius`: number - 搜索半径(米)，默认1000，选填
- `page`: number - 页码，默认1，选填
- `limit`: number - 每页数量，默认10，选填

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "stores": [
      {
        "store_id": "s123456",
        "name": "川味火锅店",
        "address": "北京市朝阳区xxx路xxx号",
        "distance": 500,
        "rating": 4.5,
        "image_url": "https://cdn.example.com/store.jpg"
      }
    ]
  }
}
```

### 3.3 位置验证
```
POST /store/location/verify
```

**请求参数**
```json
{
  "store_id": "string",       // 店铺ID，必填
  "lng": 116.4074,           // 经度，必填
  "lat": 39.9042,             // 纬度，必填
  "accuracy": 10.5,           // 定位精度，必填
  "wifi_info": {              // WiFi信息，必填
    "ssid": "Restaurant_WiFi",
    "bssid": "00:11:22:33:44:55",
    "signal_strength": -45
  }
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "verified": true,
    "is_inside": true,
    "error_message": null
  }
}
```

### 3.4 订单验证
```
POST /store/order/verify
```

**请求参数**
```json
{
  "store_id": "string",       // 店铺ID，必填
  "order_id": "string",       // 美团订单ID，必填
  "verification_code": "string" // 核销码，必填
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "verified": true,
    "order_info": {
      "order_id": "o123456",
      "total_amount": 158.50,
      "created_at": "2026-05-31T10:00:00Z"
    }
  }
}
```

## 4. 群聊接口

### 4.1 获取群聊信息
```
GET /group/{store_id}/info
```

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "group_id": "g123456",
    "store_id": "s123456",
    "name": "川味火锅店"#5号桌交流群",
    "status": 1,
    "member_count": 15,
    "max_members": 50,
    "created_at": "2026-05-31T10:00:00Z",
    "can_join": true,
    "requirement_met": {
      "location_verified": true,
      "wifi_connected": true,
      "order_verified": true
    }
  }
}
```

### 4.2 加入群聊
```
POST /group/{store_id}/join
```

**请求参数**
```json
{
  "table_number": 5,          // 桌号，必填
  "anonymous": false         // 是否匿名，选填，默认false
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "加入成功",
  "data": {
    "group_id": "g123456",
    "member_id": "m123456",
    "display_name": "5号桌",
    "join_time": "2026-05-31T10:00:00Z"
  }
}
```

### 4.3 退出群聊
```
POST /group/{group_id}/leave
```

**响应示例**
```json
{
  "code": 200,
  "message": "退出成功",
  "data": null
}
```

### 4.4 获取群聊消息
```
GET /group/{group_id}/messages
```

**查询参数**
- `page`: number - 页码，默认1，选填
- `limit`: number - 每页数量，默认20，选填
- `before_time`: string - ISO时间戳，获取此时间之前的消息，选填

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "messages": [
      {
        "message_id": "msg123",
        "sender_id": "u123",
        "sender_name": "5号桌",
        "message_type": "text",
        "content": "这个牛肉太好吃了！",
        "created_at": "2026-05-31T10:05:00Z",
        "is_review": false
      },
      {
        "message_id": "msg124",
        "sender_id": "u124",
        "sender_name": "3号桌",
        "message_type": "review",
        "content": "毛肚很新鲜，推荐！",
        "created_at": "2026-05-31T10:06:00Z",
        "is_review": true,
        "review_data": {
          "dish_id": "dish001",
          "dish_name": "毛肚",
          "rating": 5,
          "images": ["https://cdn.example.com/review1.jpg"]
        }
      }
    ]
  }
}
```

### 4.5 发送消息
```
POST /group/{group_id}/messages
```

**请求参数**
```json
{
  "content": "string",         // 消息内容，必填
  "message_type": "text",     // 消息类型：text/image/review，选填，默认text
  "review_data": {            // 评价数据，当message_type为review时必填
    "dish_id": "string",
    "dish_name": "string",
    "rating": 5,
    "images": ["string"]
  }
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "发送成功",
  "data": {
    "message_id": "msg125",
    "created_at": "2026-05-31T10:07:00Z"
  }
}
```

### 4.6 打招呼
```
POST /group/{group_id}/greeting
```

**响应示例**
```json
{
  "code": 200,
  "message": "打招呼成功",
  "data": {
    "greeting_id": "greet123",
    "target_user": "7号桌",
    "message": "你好，这里的菜品怎么样？"
  }
}
```

## 5. 漂流瓶接口

### 5.1 发送漂流瓶
```
POST /bottle/send
```

**请求参数**
```json
{
  "store_id": "string",       // 店铺ID，必填
  "content": "string",         // 问题内容，必填
  "visibility": 0             // 可见性：0-仅拾取者可见 1-全部可见，选填，默认0
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "发送成功",
  "data": {
    "bottle_id": "bottle123",
    "created_at": "2026-05-31T10:00:00Z"
  }
}
```

### 5.2 获取漂流瓶池
```
GET /bottle/pool/{store_id}
```

**查询参数**
- `visibility`: number - 可见性过滤：0/1，选填
- `page`: number - 页码，默认1，选填
- `limit`: number - 每页数量，默认10，选填

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "bottles": [
      {
        "bottle_id": "bottle123",
        "content": "这家店的招牌菜是什么？",
        "visibility": 1,
        "created_at": "2026-05-31T10:00:00Z",
        "can_pick": true,
        "response_count": 2,
        "max_responses": 20
      }
    ]
  }
}
```

### 5.3 拾取漂流瓶
```
POST /bottle/{bottle_id}/pick
```

**响应示例**
```json
{
  "code": 200,
  "message": "拾取成功",
  "data": {
    "bottle_id": "bottle123",
    "content": "这家店的招牌菜是什么？",
    "visibility": 0,
    "created_at": "2026-05-31T10:00:00Z",
    "responses": []
  }
}
```

### 5.4 回复漂流瓶
```
POST /bottle/{bottle_id}/respond
```

**请求参数**
```json
{
  "content": "string"          // 回复内容，必填
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "回复成功",
  "data": {
    "response_id": "resp123",
    "created_at": "2026-05-31T10:05:00Z"
  }
}
```

### 5.5 获取漂流瓶详情
```
GET /bottle/{bottle_id}
```

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "bottle_id": "bottle123",
    "content": "这家店的招牌菜是什么？",
    "visibility": 1,
    "created_at": "2026-05-31T10:00:00Z",
    "responses": [
      {
        "response_id": "resp123",
        "content": "毛肚是招牌，特别新鲜！",
        "sender_id": "u123",
        "is_sender": false,
        "created_at": "2026-05-31T10:05:00Z"
      },
      {
        "response_id": "resp124",
        "content": "确实，毛肚必点！",
        "sender_id": "u124",
        "is_sender": false,
        "created_at": "2026-05-31T10:06:00Z"
      }
    ]
  }
}
```

## 6. 评价接口

### 6.1 提交菜品评价
```
POST /review/dish
```

**请求参数**
```json
{
  "store_id": "string",       // 店铺ID，必填
  "dish_id": "string",        // 菜品ID，必填
  "dish_name": "string",      // 菜品名称，必填
  "rating": 5,                // 评分(1-5)，必填
  "content": "string",         // 评价内容，必填
  "images": ["string"]        // 图片URL数组，选填
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "评价成功",
  "data": {
    "review_id": "review123",
    "created_at": "2026-05-31T10:00:00Z"
  }
}
```

### 6.2 获取店铺评价
```
GET /store/{store_id}/reviews
```

**查询参数**
- `dish_id`: string - 菜品ID过滤，选填
- `rating`: number - 评分过滤(1-5)，选填
- `page`: number - 页码，默认1，选填
- `limit`: number - 每页数量，默认20，选填
- `sort_by`: string - 排序方式：rating/created_at，选填，默认created_at

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 128,
    "page": 1,
    "limit": 20,
    "reviews": [
      {
        "review_id": "review123",
        "user_id": "u123",
        "store_id": "s123",
        "dish_id": "dish001",
        "dish_name": "毛肚",
        "rating": 5,
        "content": "毛肚很新鲜，脆嫩爽口！",
        "images": ["https://cdn.example.com/review1.jpg"],
        "verified": true,
        "helpful_count": 8,
        "created_at": "2026-05-31T09:30:00Z"
      }
    ]
  }
}
```

### 6.3 获取菜品排行榜
```
GET /store/{store_id}/rankings
```

**查询参数**
- `category`: string - 分类过滤，选填
- `limit`: number - 返回数量，默认10，选填

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "rankings": [
      {
        "dish_id": "dish001",
        "dish_name": "毛肚",
        "rating": 4.8,
        "total_reviews": 45,
        "total_helpful": 380,
        "rank": 1,
        "average_rating": 4.8,
        "recommend_rate": 95.6
      },
      {
        "dish_id": "dish002",
        "dish_name": "嫩牛肉",
        "rating": 4.6,
        "total_reviews": 38,
        "total_helpful": 304,
        "rank": 2,
        "average_rating": 4.6,
        "recommend_rate": 89.5
      }
    ]
  }
}
```

### 6.4 点赞评价
```
POST /review/{review_id}/helpful
```

**请求参数**
```json
{
  "helpful": true             // 是否认为有帮助，必填
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "helpful_count": 15
  }
}
```

## 7. AI图片生成接口

### 7.1 生成场景图片
```
POST /ai/scene/generate
```

**请求参数**
```json
{
  "store_id": "string",       // 店铺ID，必填
  "parameters": {             // 生成参数，必填
    "table_count": 25,
    "weather": "sunny",
    "is_night": false,
    "chat_mood": "positive",
    "active_customers": 18
  }
}
```

**响应示例**
```json
{
  "code": 200,
  "message": "生成成功",
  "data": {
    "task_id": "task123",
    "image_url": "https://cdn.example.com/generated/scene_abc123.jpg",
    "generated_at": "2026-05-31T10:00:00Z"
  }
}
```

### 7.2 获取生成任务状态
```
GET /ai/scene/status/{task_id}
```

**响应示例**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "task_id": "task123",
    "status": "completed",  // pending/processing/completed/failed
    "progress": 100,
    "image_url": "https://cdn.example.com/generated/scene_abc123.jpg",
    "error_message": null
  }
}
```

## 8. WebSocket接口

### 8.1 连接认证
```javascript
socket.emit('auth', { token: 'jwt_token' });
```

### 8.2 群聊事件
```javascript
// 加入群聊
socket.emit('group:join', {
  group_id: 'g123456',
  table_number: 5,
  anonymous: false
});

// 发送消息
socket.emit('message:send', {
  group_id: 'g123456',
  content: '大家好，这个店怎么样？',
  message_type: 'text'
});

// 接收消息
socket.on('message:new', (data) => {
  console.log('新消息:', data);
});

// 用户状态更新
socket.on('user:status', (data) => {
  console.log('用户状态更新:', data);
});
```

### 8.3 漂流瓶事件
```javascript
// 接收新漂流瓶
socket.on('bottle:assigned', (data) => {
  console.log('收到分配的新漂流瓶:', data);
});

// 漂流瓶状态更新
socket.on('bottle:status', (data) => {
  console.log('漂流瓶状态更新:', data);
});
```

## 9. 错误码说明

| 错误码 | 含义 |
|-------|------|
| 200 | 成功 |
| 40001 | 参数错误 |
| 40002 | 认证失败 |
| 40003 | 权限不足 |
| 40004 | 资源不存在 |
| 40005 | 操作失败 |
| 40006 | 频率限制 |
| 40007 | 用户已存在 |
| 40008 | 店铺不存在 |
| 40009 | 群聊已满 |
| 40010 | 不满足加入条件 |
| 40011 | 漂流瓶不存在 |
| 40012 | 漂流瓶已过期 |
| 40013 | 超出限制 |
| 50000 | 服务器内部错误 |

## 10. 数据格式说明

### 时间格式
所有时间均使用ISO 8601格式：`2026-05-31T10:00:00Z`

### 地理位置
- 经度(longitude)：-180 到 +180
- 纬度(latitude)：-90 到 +90
- 精度(accuracy)：单位米，越小越精确

### 评分制度
- 评分范围：1-5分
- 1分：非常不满意
- 3分：一般
- 5分：非常满意

## 11. 频率限制

- 普通API：100次/分钟/IP
- 发送消息：10次/分钟/用户
- 发送漂流瓶：5次/天/用户
- 打招呼：20次/小时/用户
- 提交评价：每个菜品1次/用户

## 12. 版本更新记录

### v1.0.0 (2026-05-31)
- 初始版本发布
- 包含所有基础功能接口
- 完善的错误处理和文档说明
# 58信息网 - 后端服务器

## 技术栈
- Node.js 18+
- Express.js 4.x
- MySQL/PostgreSQL (待集成)
- JWT 认证

## 目录结构
```
server/
├── app.js              # 应用主入口
├── config/             # 配置文件
│   └── config.js       # 统一配置管理
├── controllers/        # 控制器（业务逻辑）
├── models/            # 数据模型
├── routes/            # 路由定义
│   ├── index.js       # 路由入口
│   ├── ads.routes.js  # 广告相关路由
│   ├── auth.routes.js # 认证相关路由
│   ├── users.routes.js # 用户相关路由
│   └── health.routes.js # 健康检查路由
├── middleware/        # 中间件
│   ├── errorHandler.js # 错误处理
│   └── logger.js      # 日志记录
├── utils/             # 工具函数
├── tests/             # 测试文件
├── public/            # 静态文件
├── uploads/           # 上传文件存储
└── logs/              # 日志文件

```

## 安装依赖

```bash
npm install
```

## 环境配置

1. 复制环境变量示例文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置数据库连接等信息

## 运行服务器

### 开发模式（自动重启）
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

## API 端点

服务器默认运行在 `http://localhost:3003`

### 基础端点
- `GET /health` - 健康检查
- `GET /api/v1` - API 信息

### 认证相关
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - 刷新令牌
- `POST /api/v1/auth/forgot-password` - 忘记密码
- `POST /api/v1/auth/reset-password` - 重置密码

### 广告管理
- `GET /api/v1/ads` - 获取广告列表（支持分页、筛选）
- `GET /api/v1/ads/:id` - 获取单个广告
- `POST /api/v1/ads` - 创建新广告（需要认证）
- `PUT /api/v1/ads/:id` - 更新广告（需要认证）
- `DELETE /api/v1/ads/:id` - 删除广告（需要认证）
- `PATCH /api/v1/ads/:id/position` - 更新广告位置（需要认证）

### 用户管理
- `GET /api/v1/users` - 获取用户列表（管理员）
- `GET /api/v1/users/profile` - 获取当前用户信息
- `GET /api/v1/users/:id` - 获取指定用户信息
- `PUT /api/v1/users/profile` - 更新当前用户信息
- `PUT /api/v1/users/:id` - 更新用户信息（管理员）
- `DELETE /api/v1/users/:id` - 删除用户（管理员）
- `PUT /api/v1/users/change-password` - 修改密码

## 中间件说明

### 已配置的中间件
- **Helmet** - 安全头部设置
- **CORS** - 跨域资源共享
- **Rate Limiting** - 请求频率限制
- **Compression** - 响应压缩
- **Morgan** - HTTP 请求日志
- **Body Parser** - 请求体解析
- **Error Handler** - 统一错误处理

### 安全特性
- XSS 防护
- CSRF 保护（待实现）
- SQL 注入防护（待实现）
- 请求频率限制
- 输入验证（express-validator）

## 环境变量说明

查看 `.env.example` 文件了解所有可配置的环境变量。

主要配置项：
- `PORT` - 服务器端口
- `NODE_ENV` - 运行环境（development/production）
- `DB_*` - 数据库配置
- `JWT_SECRET` - JWT 密钥
- `CORS_ORIGIN` - 允许的跨域来源

## 日志

日志文件存储在 `logs/` 目录下：
- `access.log` - HTTP 访问日志
- `error.log` - 错误日志
- `app.log` - 应用日志

## 测试

```bash
npm test
```

## 部署

1. 设置生产环境变量
2. 安装 PM2：`npm install -g pm2`
3. 启动服务：`pm2 start app.js --name "58info-api"`

## 待完成功能

- [ ] 数据库集成（MySQL/PostgreSQL）
- [ ] JWT 认证中间件实现
- [ ] 文件上传功能
- [ ] Redis 缓存集成
- [ ] WebSocket 实时通信
- [ ] 邮件发送功能
- [ ] 单元测试和集成测试
- [ ] API 文档（Swagger）
- [ ] Docker 容器化配置

## 许可证

ISC
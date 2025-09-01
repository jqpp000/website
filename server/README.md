# 58信息网 - 后端服务器

## 快速开始

### 1. 安装依赖
打开命令提示符（CMD）或 PowerShell，进入 server 目录：
```bash
cd D:\website\server
npm install
```

### 2. 启动服务器

#### 开发模式（自动重启）
```bash
npm run dev
```

#### 生产模式
```bash
npm start
```

服务器将在 http://localhost:3003 启动

### 3. 测试 API
打开浏览器访问：
- http://localhost:3003/health - 健康检查
- http://localhost:3003/api/v1 - API 信息
- http://localhost:3003/api/v1/ads - 广告列表

## 目录结构
```
server/
├── app.js              # 应用主入口
├── package.json        # 项目配置
├── .env               # 环境变量（敏感信息）
├── .env.example       # 环境变量示例
├── config/            # 配置文件
│   └── config.js      # 统一配置管理
├── routes/            # API 路由
│   ├── index.js       # 路由入口
│   ├── ads.routes.js  # 广告相关路由
│   ├── auth.routes.js # 认证相关路由
│   ├── users.routes.js # 用户相关路由
│   └── health.routes.js # 健康检查路由
├── middleware/        # 中间件
│   ├── errorHandler.js # 错误处理
│   └── logger.js      # 日志记录
├── controllers/       # 控制器（待实现）
├── models/           # 数据模型（待实现）
├── utils/            # 工具函数（待实现）
├── tests/            # 测试文件（待实现）
├── public/           # 静态文件
├── uploads/          # 上传文件存储
└── logs/             # 日志文件（自动生成）
```

## API 端点列表

### 认证相关 (/api/v1/auth)
- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `POST /logout` - 用户登出
- `POST /refresh` - 刷新令牌
- `POST /forgot-password` - 忘记密码
- `POST /reset-password` - 重置密码

### 广告管理 (/api/v1/ads)
- `GET /` - 获取广告列表（支持分页、筛选）
- `GET /:id` - 获取单个广告
- `POST /` - 创建新广告（需要认证）
- `PUT /:id` - 更新广告（需要认证）
- `DELETE /:id` - 删除广告（需要认证）
- `PATCH /:id/position` - 更新广告位置（需要认证）

### 用户管理 (/api/v1/users)
- `GET /` - 获取用户列表（管理员）
- `GET /profile` - 获取当前用户信息
- `GET /:id` - 获取指定用户信息
- `PUT /profile` - 更新当前用户信息
- `PUT /:id` - 更新用户信息（管理员）
- `DELETE /:id` - 删除用户（管理员）
- `PUT /change-password` - 修改密码

### 健康检查 (/api/v1/health)
- `GET /` - 详细健康信息
- `GET /ping` - 简单 ping 测试

## 环境变量配置

查看 `.env.example` 文件了解所有配置项。主要配置：

- `PORT` - 服务器端口（默认 3003）
- `NODE_ENV` - 运行环境（development/production）
- `DB_*` - 数据库配置
- `JWT_SECRET` - JWT 密钥
- `CORS_ORIGIN` - 允许的跨域来源

## 安全特性

- ✅ Helmet - 安全头部设置
- ✅ CORS - 跨域资源共享控制
- ✅ Rate Limiting - 请求频率限制
- ✅ Input Validation - 输入验证
- ✅ Error Handling - 统一错误处理
- ✅ Compression - 响应压缩

## 下一步开发

1. **数据库集成**
   - 安装 MySQL 或 PostgreSQL
   - 创建数据模型
   - 实现数据持久化

2. **用户认证**
   - 实现 JWT 认证中间件
   - 完善用户注册/登录逻辑
   - 添加权限控制

3. **管理后台**
   - 创建管理界面
   - 连接后端 API
   - 实现可视化管理

## 常见问题

### 端口被占用？
修改 `.env` 文件中的 `PORT` 值

### 跨域问题？
在 `.env` 文件的 `CORS_ORIGIN` 中添加前端地址

### 如何查看日志？
日志文件在 `logs/` 目录下

## 技术支持

如有问题，请查看项目文档或联系开发团队。
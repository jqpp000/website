# 项目结构说明

## 基于 Docker 的项目结构
```markdown
website/
├── frontend/              # 前端代码（纯静态）
│   ├── index.html         # 主页面
│   ├── login.html         # 登录页
│   ├── admin.html         # 管理后台
│   ├── styles.css         # 全局样式
│   ├── scripts.js         # 交互逻辑
│   ├── Dockerfile         # 前端容器配置
│   └── vite.config.js     # Vite 构建配置
│
├── server/                # 后端代码（Node.js）
│   ├── app.js             # Express 入口
│   ├── Dockerfile         # 后端容器配置
│   ├── routes/            # API 路由
│   └── config/            # 服务配置
│
├── nginx/                 # 反向代理配置
│   ├── nginx.conf         # Nginx 配置
│   └── Dockerfile         # Nginx 容器配置
│
├── docker-compose.yml     # 多容器编排
├── Dockerfile             # 全局容器配置（备用）
└── .env                   # 环境变量
```

## 容器化部署指南

### 启动所有服务
```powershell
docker-compose up -d  # 启动前端、后端和 Nginx
```

### 容器说明
- **前端**：基于 `nginx:alpine`，托管静态文件。
- **后端**：基于 `node:18`，提供 API 服务。
- **Nginx**：反向代理，处理静态资源和 API 路由。

## 开发指南

### 前端开发
1. 修改 `frontend/` 下的文件。
2. 实时预览：
   ```powershell
   cd frontend && npm run dev  # 需安装 Vite
   ```

### 后端开发
1. 修改 `server/` 下的代码。
2. 本地调试：
   ```powershell
   cd server && npm start  # 需安装 Node.js
   ```

## 关键配置

### 端口映射
- 前端：`80` → `frontend:80`（通过 Nginx）
- 后端：`3003` → `server:3003`

### 环境变量
- 在 `.env` 中配置数据库连接等敏感信息。

## 注意事项
1. **数据持久化**：确保数据库卷（如 `./data`）已映射。
2. **构建缓存**：清理旧镜像：
   ```powershell
   docker system prune -f
   ```

## 测试与部署
- **单元测试**：运行 `npm test`。
- **生产构建**：执行 `scripts/build.js`。
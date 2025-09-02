# 58信息网广告管理系统 - 完整文档

## 📋 目录

- [项目概述](#项目概述)
- [快速开始](#快速开始)
- [系统架构](#系统架构)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [部署指南](#部署指南)
- [API文档](#api文档)
- [数据库设计](#数据库设计)
- [开发计划](#开发计划)
- [测试报告](#测试报告)
- [维护指南](#维护指南)
- [故障排除](#故障排除)

---

## 🎯 项目概述

这是一个完整的广告管理系统，包含前端广告展示页面和后台管理系统。系统实现了广告的全生命周期管理，支持添加、编辑、删除、续费、状态监控等功能。

### 项目结构

```
website/
├── frontend/                    # 前端广告展示页面
│   ├── index.html             # 主页面（广告展示）
│   ├── styles.css             # 样式文件
│   └── images1/               # 图片资源
├── admin/                      # 后台管理系统
│   ├── index.html             # 后台主页面
│   ├── styles.css             # 后台样式
│   ├── script.js              # 后台逻辑
│   └── README.md              # 后台使用说明
├── server/                     # 后端服务器
│   ├── app.js                 # 主应用文件
│   ├── config/                # 配置文件
│   ├── models/                # 数据模型
│   ├── routes/                # 路由
│   ├── middleware/            # 中间件
│   ├── scripts/               # 脚本文件
│   └── database/              # 数据库相关
└── docs/                      # 项目文档
    └── README.md              # 本文档
```

---

## 🚀 快速开始

### 方式1：静态页面（无需数据库）

```bash
# 直接打开前端页面
open frontend/index.html

# 打开后台管理系统
open admin/index.html
# 默认登录：admin / admin123
```

### 方式2：完整系统（推荐）

```bash
# 1. 安装MySQL数据库
# 2. 配置环境变量
cp server/.env.example server/.env
# 编辑 .env 文件，设置数据库连接信息

# 3. 启动后端服务器
cd server
start.bat  # Windows
# 或
npm install && npm run dev  # Linux/macOS

# 4. 访问系统
# 前端页面: http://localhost:3003
# 后台管理: http://localhost:3003/admin
# API接口: http://localhost:3003/api/v1
```

### 默认账号

- **管理员**: admin / admin123
- **操作员**: operator / operator123

---

## 🏗️ 系统架构

### 前端技术
- **HTML5**：语义化标签和现代HTML特性
- **CSS3**：Flexbox、Grid、动画、响应式设计
- **JavaScript**：ES6+语法、模块化编程
- **Font Awesome**：图标库

### 后端技术
- **Node.js**：JavaScript运行时环境
- **Express**：Web应用框架
- **Sequelize**：ORM数据库操作
- **MySQL**：关系型数据库
- **JWT**：身份验证
- **bcrypt**：密码加密

### 数据存储
- **当前实现**：MySQL数据库 + 浏览器本地存储（localStorage）
- **扩展方案**：MySQL集群 + Redis缓存 + 云存储

---

## ✨ 功能特性

### 前端展示页面
- **四个广告区域**：黄色置顶区、套白区域、套淡黄区域、套青区域
- **动态广告加载**：支持随机排序和动态内容更新
- **响应式设计**：适配不同设备尺寸

### 后台管理系统
- **用户认证**：管理员登录、记住密码、状态保持
- **仪表盘**：广告统计、状态监控、到期提醒
- **广告管理**：完整的CRUD操作、筛选搜索、批量操作
- **区域管理**：四个区域统计和容量监控
- **操作日志**：完整的操作记录
- **系统设置**：参数配置、阈值设置

---

## 🛠️ 技术栈

### 开发环境
- Node.js 16+
- MySQL 8.0+
- npm/yarn

### 生产环境
- PM2/Docker
- Nginx
- SSL证书

### 兼容性
- **浏览器支持**：Chrome、Firefox、Edge、Safari
- **设备支持**：PC、平板、手机等

---

## 📦 部署指南

### 开发环境部署

1. **克隆项目**
```bash
git clone <repository-url>
cd website
```

2. **安装依赖**
```bash
cd server
npm install
```

3. **配置环境**
```bash
cp .env.example .env
# 编辑 .env 文件
```

4. **启动服务**
```bash
npm run dev
```

### 生产环境部署

1. **数据库部署**
```bash
# 安装MySQL 8.0+ 数据库
# 执行 server/database/schema.sql 创建表结构
# 配置环境变量连接数据库
# 运行 node scripts/init-database.js 初始化数据
```

2. **应用部署**
```bash
# 使用PM2或Docker容器化部署
# 配置Nginx反向代理
# 设置SSL证书（HTTPS）
# 配置数据库备份策略
```

---

## 📚 API文档

### 认证接口
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/logout` - 用户登出

### 广告管理接口
- `GET /api/v1/ads` - 获取所有广告
- `POST /api/v1/ads` - 创建新广告
- `PUT /api/v1/ads/:id` - 更新广告
- `DELETE /api/v1/ads/:id` - 删除广告
- `GET /api/v1/ads/statistics` - 获取广告统计

### 系统接口
- `GET /api/v1/health` - 健康检查
- `GET /api/v1/settings` - 获取系统设置
- `PUT /api/v1/settings` - 更新系统设置

---

## 🗄️ 数据库设计

### 核心表结构

| 表名 | 用途 | 记录数 |
|------|------|--------|
| `users` | 用户管理 | ~10 |
| `ads` | 广告信息 | ~1000+ |
| `renewal_logs` | 续费记录 | ~500+ |
| `operation_logs` | 操作日志 | ~10000+ |
| `system_settings` | 系统配置 | ~20 |

### 数据关系
```
用户 (1) ←→ (N) 操作日志
广告 (1) ←→ (N) 续费记录
```

详细数据库设计请参考：[数据库设计文档](database-design.md)

---

## 📅 开发计划

### 已完成功能
- ✅ 前端广告展示页面
- ✅ 后台管理系统
- ✅ 数据库集成
- ✅ API接口开发
- ✅ 用户认证系统

### 进行中功能
- 🔄 数据迁移工具
- 🔄 性能优化

### 计划功能
- [ ] 数据导出功能（Excel、PDF）
- [ ] 用户权限管理
- [ ] 广告审核流程
- [ ] 数据统计分析
- [ ] 监控告警系统

详细开发计划请参考：[开发计划文档](development-plan.md)

---

## 🧪 测试报告

系统已通过完整的功能测试，测试覆盖率达到100%：

- **用户认证**：5项测试全部通过
- **仪表盘**：4项测试全部通过
- **广告管理**：12项测试全部通过
- **区域管理**：3项测试全部通过
- **操作日志**：2项测试全部通过
- **系统设置**：2项测试全部通过

详细测试报告请参考：[测试报告文档](test-report.md)

---

## 🔧 维护指南

### 日常维护
1. **数据备份**：定期备份数据库
2. **状态监控**：关注广告到期提醒
3. **日志查看**：定期检查操作日志
4. **性能监控**：监控系统性能指标

### 定期维护
```bash
# 清理过期日志（保留90天）
DELETE FROM operation_logs 
WHERE operation_time < DATE_SUB(NOW(), INTERVAL 90 DAY);

# 优化表
OPTIMIZE TABLE ads, operation_logs;

# 分析表
ANALYZE TABLE ads, operation_logs;
```

---

## 🚨 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查MySQL服务状态
sudo systemctl status mysql

# 检查端口占用
netstat -tlnp | grep 3306

# 检查防火墙
sudo ufw status
```

#### 2. 端口占用问题
```bash
# 查找占用端口的进程
netstat -ano | findstr :3003

# 终止进程
taskkill /PID <PID> /F
```

#### 3. 权限问题
```sql
-- 创建用户并授权
CREATE USER 'ads_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON ads_system.* TO 'ads_user'@'localhost';
FLUSH PRIVILEGES;
```

### 日志查看
```bash
# MySQL错误日志
sudo tail -f /var/log/mysql/error.log

# 应用日志
tail -f logs/app.log
```

---

## 📞 技术支持

### 联系方式
- **项目文档**: 查看 `docs/` 目录
- **技术论坛**: 提交Issue或讨论
- **官方支持**: MySQL和Sequelize文档

### 相关链接
- [MySQL官方文档](https://dev.mysql.com/doc/)
- [Sequelize文档](https://sequelize.org/)
- [Express文档](https://expressjs.com/)

---

## 📄 许可证

本项目基于 MIT 许可证开源。

---

*最后更新：2025年9月2日*

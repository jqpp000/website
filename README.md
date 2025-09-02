# 58信息网 - 新电脑快速部署

## 🚀 最推荐流程（超简单）

### 当前电脑操作

#### 步骤1：打包项目
```bash
# 双击运行
create-project-package.bat
```

#### 步骤2：传输项目
- 将生成的 `project-package` 文件夹复制到新电脑
- 重命名为 `website`

### 新电脑操作

#### 步骤1：安装Docker Desktop
1. 下载：https://www.docker.com/products/docker-desktop
2. 安装并启动
3. 等待完全加载完成

#### 步骤2：启动项目
```bash
# 进入项目目录
cd website

# 一键启动
docker-start.bat
```

#### 步骤3：开始开发
访问地址：
- 前端页面: http://localhost:3003
- 后台管理: http://localhost:3003/admin
- API接口: http://localhost:3003/api/v1

## 🛠️ 管理工具

```bash
# 管理Docker服务
docker-manage.bat

# 查看服务状态
docker-compose -f docker-simple.yml ps

# 查看日志
docker-compose -f docker-simple.yml logs

# 停止服务
docker-compose -f docker-simple.yml down
```

## 🔍 故障排除

### 常见问题

1. **Docker未启动**
   - 确保Docker Desktop正在运行
   - 等待完全加载完成

2. **端口被占用**
   - 检查端口3003是否被占用
   - 使用 `docker-manage.bat` 重启服务

3. **项目文件缺失**
   - 确保所有项目文件都已复制
   - 检查 `docker-simple.yml` 是否存在

## 📞 技术支持

如遇问题，请检查：
1. Docker Desktop是否正常运行
2. 项目文件是否完整
3. 端口3003是否被占用
4. 使用 `docker-manage.bat` 查看服务状态

## 🎯 总结

**新电脑部署只需要：**
1. 安装Docker Desktop
2. 运行一个bat文件
3. 开始开发！

**完全不需要：**
- 安装Node.js
- 安装MySQL
- 配置环境变量
- 手动启动服务

# 使用官方Node镜像作为基础
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY package*.json ./
COPY . .

# 安装依赖
RUN npm install

# 暴露端口（根据实际项目调整）
EXPOSE 3000

# 启动命令（根据实际项目调整）
CMD ["npm", "start"]
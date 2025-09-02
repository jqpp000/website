# 使用官方Node.js镜像
FROM node:18-alpine

# 设置字符编码环境变量
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV NODE_ENV=development

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3003

# 启动命令
CMD ["npm", "start"]

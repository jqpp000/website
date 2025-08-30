// 配置文件
module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 27017,
    name: process.env.DB_NAME || 'myapp'
  },
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'default-secret-change-in-production'
  }
};

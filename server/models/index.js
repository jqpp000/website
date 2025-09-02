const { Sequelize } = require('sequelize');
const config = require('../config/config');

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    pool: config.database.pool,
    timezone: '+08:00', // 设置时区为北京时间
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'create_time',
      updatedAt: 'update_time',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

// 导入模型
const User = require('./User')(sequelize, Sequelize);
const Ad = require('./Ad')(sequelize, Sequelize);
const RenewalLog = require('./RenewalLog')(sequelize, Sequelize);
const OperationLog = require('./OperationLog')(sequelize, Sequelize);
const SystemSetting = require('./SystemSetting')(sequelize, Sequelize);

// 定义模型关联关系
Ad.hasMany(RenewalLog, { foreignKey: 'ad_id', as: 'renewals' });
RenewalLog.belongsTo(Ad, { foreignKey: 'ad_id', as: 'ad' });

User.hasMany(OperationLog, { foreignKey: 'user_name', sourceKey: 'username', as: 'operations' });
OperationLog.belongsTo(User, { foreignKey: 'user_name', targetKey: 'username', as: 'user' });

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 同步数据库表结构
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ 数据库表同步完成');
    return true;
  } catch (error) {
    console.error('❌ 数据库表同步失败:', error.message);
    return false;
  }
};

module.exports = {
  sequelize,
  User,
  Ad,
  RenewalLog,
  OperationLog,
  SystemSetting,
  testConnection,
  syncDatabase
};

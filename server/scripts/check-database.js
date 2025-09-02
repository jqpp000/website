const mysql = require('mysql2/promise');

async function checkDatabaseConnection() {
  console.log('🔍 检查数据库连接...');
  
  try {
    // 尝试连接数据库
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ads_system'
    });
    
    console.log('✅ 数据库连接成功！');
    await connection.end();
    return true;
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 建议解决方案：');
      console.log('   1. 启动MySQL服务');
      console.log('   2. 检查数据库配置');
      console.log('   3. 确认数据库用户权限');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 建议解决方案：');
      console.log('   1. 检查用户名和密码');
      console.log('   2. 确认用户权限');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 建议解决方案：');
      console.log('   1. 创建数据库: CREATE DATABASE ads_system;');
      console.log('   2. 检查数据库名称配置');
    }
    
    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkDatabaseConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkDatabaseConnection };

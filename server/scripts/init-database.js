const { testConnection, syncDatabase, User, SystemSetting } = require('../models');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
  console.log('🚀 开始初始化数据库...');
  
  try {
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }

    // 同步数据库表结构
    console.log('📋 同步数据库表结构...');
    await syncDatabase(false); // 不强制重建表

    // 初始化系统设置
    console.log('⚙️ 初始化系统设置...');
    await SystemSetting.initializeDefaults();

    // 创建默认管理员用户
    console.log('👤 创建默认管理员用户...');
    const adminExists = await User.findByUsername('admin');
    
    if (!adminExists) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('admin123', saltRounds);
      
      await User.create({
        username: 'admin',
        password_hash: passwordHash,
        real_name: '系统管理员',
        role: 'admin',
        status: 'active',
        email: 'admin@example.com'
      });
      
      console.log('✅ 默认管理员用户创建成功');
      console.log('   用户名: admin');
      console.log('   密码: admin123');
    } else {
      console.log('ℹ️ 管理员用户已存在');
    }

    // 创建测试操作员用户
    console.log('👤 创建测试操作员用户...');
    const operatorExists = await User.findByUsername('operator');
    
    if (!operatorExists) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('operator123', saltRounds);
      
      await User.create({
        username: 'operator',
        password_hash: passwordHash,
        real_name: '测试操作员',
        role: 'operator',
        status: 'active',
        email: 'operator@example.com'
      });
      
      console.log('✅ 测试操作员用户创建成功');
      console.log('   用户名: operator');
      console.log('   密码: operator123');
    } else {
      console.log('ℹ️ 操作员用户已存在');
    }

    console.log('🎉 数据库初始化完成！');
    console.log('');
    console.log('📊 可用的测试账号：');
    console.log('   管理员: admin / admin123');
    console.log('   操作员: operator / operator123');
    console.log('');
    console.log('🔗 访问地址：');
    console.log('   前端页面: http://localhost:3003');
    console.log('   后台管理: http://localhost:3003/admin');
    console.log('   API接口: http://localhost:3003/api/v1');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };

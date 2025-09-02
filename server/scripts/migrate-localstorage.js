const { Ad, OperationLog, SystemSetting } = require('../models');

// 模拟localStorage数据（实际使用时从前端导出）
const mockLocalStorageData = {
  ads: [
    {
      id: 1,
      title: "测试广告1",
      content: "这是一个测试广告内容",
      link: "https://example.com/1",
      region: "yellow",
      start_date: "2024-01-01T00:00:00.000Z",
      end_date: "2024-12-31T23:59:59.999Z",
      experience: "2倍经验",
      version: "最新版本",
      sort_weight: 100,
      status: "active",
      create_user: "admin"
    },
    {
      id: 2,
      title: "测试广告2",
      content: "这是另一个测试广告内容",
      link: "https://example.com/2",
      region: "white",
      start_date: "2024-01-01T00:00:00.000Z",
      end_date: "2024-12-31T23:59:59.999Z",
      experience: "3倍经验",
      version: "稳定版本",
      sort_weight: 90,
      status: "active",
      create_user: "admin"
    }
  ],
  logs: [
    {
      user_name: "admin",
      operation_type: "login",
      operation_detail: "用户 admin 登录系统",
      ip_address: "127.0.0.1",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      status: "success"
    }
  ],
  settings: {
    "expiry_warning_days": 7,
    "page_size": 20,
    "auto_refresh_interval": 60
  }
};

async function migrateLocalStorageData() {
  console.log('🔄 开始迁移localStorage数据到数据库...');
  
  try {
    // 迁移广告数据
    console.log('📢 迁移广告数据...');
    let migratedAds = 0;
    
    for (const adData of mockLocalStorageData.ads) {
      try {
        // 检查广告是否已存在
        const existingAd = await Ad.findOne({
          where: { 
            title: adData.title,
            region: adData.region
          }
        });
        
        if (!existingAd) {
          await Ad.create({
            title: adData.title,
            content: adData.content,
            link: adData.link,
            region: adData.region,
            start_date: new Date(adData.start_date),
            end_date: new Date(adData.end_date),
            experience: adData.experience,
            version: adData.version,
            sort_weight: adData.sort_weight,
            status: adData.status,
            create_user: adData.create_user || 'admin'
          });
          migratedAds++;
        }
      } catch (error) {
        console.error(`❌ 迁移广告失败: ${adData.title}`, error.message);
      }
    }
    
    console.log(`✅ 广告数据迁移完成，共迁移 ${migratedAds} 条记录`);

    // 迁移操作日志
    console.log('📝 迁移操作日志...');
    let migratedLogs = 0;
    
    for (const logData of mockLocalStorageData.logs) {
      try {
        await OperationLog.create({
          user_name: logData.user_name,
          operation_type: logData.operation_type,
          operation_detail: logData.operation_detail,
          ip_address: logData.ip_address,
          user_agent: logData.user_agent,
          status: logData.status
        });
        migratedLogs++;
      } catch (error) {
        console.error(`❌ 迁移日志失败: ${logData.operation_type}`, error.message);
      }
    }
    
    console.log(`✅ 操作日志迁移完成，共迁移 ${migratedLogs} 条记录`);

    // 迁移系统设置
    console.log('⚙️ 迁移系统设置...');
    let migratedSettings = 0;
    
    for (const [key, value] of Object.entries(mockLocalStorageData.settings)) {
      try {
        await SystemSetting.setValue(key, value, {
          description: `从localStorage迁移的设置：${key}`,
          type: typeof value === 'number' ? 'number' : 'string'
        });
        migratedSettings++;
      } catch (error) {
        console.error(`❌ 迁移设置失败: ${key}`, error.message);
      }
    }
    
    console.log(`✅ 系统设置迁移完成，共迁移 ${migratedSettings} 项设置`);

    console.log('🎉 数据迁移完成！');
    console.log('');
    console.log('📊 迁移统计：');
    console.log(`   广告数据: ${migratedAds} 条`);
    console.log(`   操作日志: ${migratedLogs} 条`);
    console.log(`   系统设置: ${migratedSettings} 项`);

  } catch (error) {
    console.error('❌ 数据迁移失败:', error.message);
    process.exit(1);
  }
}

// 从文件读取localStorage数据
async function migrateFromFile(filePath) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 文件不存在: ${filePath}`);
      return;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const localStorageData = JSON.parse(fileContent);
    
    console.log('📁 从文件读取数据:', filePath);
    console.log(`   广告数量: ${localStorageData.ads?.length || 0}`);
    console.log(`   日志数量: ${localStorageData.logs?.length || 0}`);
    console.log(`   设置数量: ${Object.keys(localStorageData.settings || {}).length}`);
    
    // 使用文件数据替换模拟数据
    mockLocalStorageData.ads = localStorageData.ads || [];
    mockLocalStorageData.logs = localStorageData.logs || [];
    mockLocalStorageData.settings = localStorageData.settings || {};
    
    await migrateLocalStorageData();
    
  } catch (error) {
    console.error('❌ 读取文件失败:', error.message);
  }
}

// 导出localStorage数据的辅助函数
function exportLocalStorageData() {
  const exportData = {
    ads: mockLocalStorageData.ads,
    logs: mockLocalStorageData.logs,
    settings: mockLocalStorageData.settings,
    exportTime: new Date().toISOString()
  };
  
  const fs = require('fs');
  const path = require('path');
  
  const exportPath = path.join(__dirname, '../exports/localstorage-export.json');
  const exportDir = path.dirname(exportPath);
  
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  console.log(`✅ 数据已导出到: ${exportPath}`);
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'migrate':
    migrateLocalStorageData();
    break;
  case 'migrate-file':
    const filePath = args[1];
    if (!filePath) {
      console.error('❌ 请指定文件路径: node migrate-localstorage.js migrate-file <filepath>');
      process.exit(1);
    }
    migrateFromFile(filePath);
    break;
  case 'export':
    exportLocalStorageData();
    break;
  default:
    console.log('📖 使用方法:');
    console.log('   node migrate-localstorage.js migrate          # 迁移模拟数据');
    console.log('   node migrate-localstorage.js migrate-file <file>  # 从文件迁移数据');
    console.log('   node migrate-localstorage.js export           # 导出模拟数据');
    break;
}

module.exports = { migrateLocalStorageData, migrateFromFile, exportLocalStorageData };

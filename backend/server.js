const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // 新增：用于密码加密
const app = express();
const port = 3000;

// 数据库连接配置
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // 替换为你的数据库密码
  database: 'game_ad_db', // 建议使用更明确的数据库名
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00' // 改为UTC时区存储，与前端统一
});

// 初始化数据库表结构（修复版）
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 创建广告表（匹配前端需求的字段结构）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        server_name VARCHAR(255) NOT NULL,
        area ENUM('CN', 'US', 'EU', 'JP', 'KR', 'OTHER') NOT NULL, -- 匹配前端地区值
        open_time DATETIME NOT NULL, -- 存储UTC时间
        expire_time DATETIME NOT NULL, -- 直接存储过期时间，不通过计算
        feature TEXT,
        exp_rate VARCHAR(50),
        version VARCHAR(50),
        homepage VARCHAR(255),
        enable_reminder BOOLEAN DEFAULT FALSE,
        reminder_time INT, -- 提前提醒时间（小时）
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建管理员表（增强安全性）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL, -- 存储加密后的密码
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 插入默认管理员账号 (密码: admin123，已加密)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.execute(`
      INSERT IGNORE INTO admin (username, password) 
      VALUES ('admin', ?)
    `, [hashedPassword]);
    
    console.log('数据库表结构初始化完成');
    connection.release();
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

// 初始化数据库
initializeDatabase();

// 中间件配置
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());

// 工具函数：将UTC时间转换为时间戳（毫秒）
const datetimeToTimestamp = (datetime) => {
  return new Date(datetime).getTime();
};

// 1. 测试路由
app.get('/api/test', (req, res) => {
  res.json({ code: 200, message: '服务器正常运行' });
});

// 2. 获取服务器当前时间（UTC）
app.get('/api/time', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP()) * 1000 AS timestamp
    `);
    const serverTime = rows[0].timestamp; // 毫秒级UTC时间戳
    
    res.json({
      currentTime: new Date(serverTime).toISOString() // 符合前端预期的ISO格式
    });
  } catch (error) {
    console.error('获取服务器时间失败:', error);
    res.status(500).json({ error: '获取服务器时间失败' });
  }
});

// 3. 管理员登录（修复密码验证）
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM admin WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    // 使用bcrypt验证密码
    const isPasswordValid = await bcrypt.compare(password, rows[0].password);
    if (isPasswordValid) {
      res.json({ message: '登录成功', token: 'admin_token' }); // 实际项目应使用JWT
    } else {
      res.status(401).json({ error: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 4. 获取广告列表（核心修复：匹配前端需求）
app.get('/api/ads', async (req, res) => {
  try {
    const { search, area, status } = req.query;
    let query = `
      SELECT id, server_name, area, open_time, expire_time, 
             feature, exp_rate, version, homepage, 
             enable_reminder, reminder_time
      FROM ads
      WHERE 1=1
    `;
    const params = [];
    
    // 搜索筛选（服务器名或特性）
    if (search) {
      query += ` AND (server_name LIKE ? OR feature LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }
    
    // 地区筛选
    if (area) {
      query += ` AND area = ?`;
      params.push(area);
    }
    
    // 状态筛选（基于当前UTC时间）
    if (status) {
      const [timeRows] = await pool.execute('SELECT UTC_TIMESTAMP() AS now');
      const currentTime = timeRows[0].now;
      
      switch (status) {
        case 'active':
          query += ` AND open_time <= ? AND expire_time > ?`;
          params.push(currentTime, currentTime);
          break;
        case 'upcoming':
          query += ` AND open_time > ?`;
          params.push(currentTime);
          break;
        case 'expired':
          query += ` AND expire_time <= ?`;
          params.push(currentTime);
          break;
      }
    }
    
    // 按开始时间排序
    query += ` ORDER BY open_time DESC`;
    
    const [rows] = await pool.execute(query, params);
    
    // 转换为前端需要的格式（时间戳）
    const ads = rows.map(ad => ({
      id: ad.id,
      server_name: ad.server_name,
      area: ad.area,
      originalOpenTime: datetimeToTimestamp(ad.open_time), // 转换为毫秒时间戳
      originalExpireTime: datetimeToTimestamp(ad.expire_time),
      feature: ad.feature,
      exp_rate: ad.exp_rate,
      version: ad.version,
      homepage: ad.homepage,
      enable_reminder: ad.enable_reminder,
      reminder_time: ad.reminder_time
    }));
    
    res.json(ads);
  } catch (error) {
    console.error('获取广告列表失败:', error);
    res.status(500).json({ error: '获取广告列表失败' });
  }
});

// 5. 新增广告（批量）
app.post('/api/ads/batch', async (req, res) => {
  try {
    const ads = req.body;
    if (!Array.isArray(ads) || ads.length === 0) {
      return res.status(400).json({ error: '请提供有效的广告数据' });
    }
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const results = [];
    for (const ad of ads) {
      const [result] = await connection.execute(`
        INSERT INTO ads (
          server_name, area, open_time, expire_time, 
          feature, exp_rate, version, homepage, 
          enable_reminder, reminder_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ad.server_name,
        ad.area,
        new Date(ad.open_time).toISOString().slice(0, 19).replace('T', ' '),
        new Date(ad.expire_time).toISOString().slice(0, 19).replace('T', ' '),
        ad.feature,
        ad.exp_rate,
        ad.version,
        ad.homepage,
        ad.enable_reminder ? 1 : 0,
        ad.reminder_time
      ]);
      
      results.push({ id: result.insertId, ...ad });
    }
    
    await connection.commit();
    connection.release();
    
    res.status(201).json(results);
  } catch (error) {
    console.error('新增广告失败:', error);
    res.status(500).json({ error: '新增广告失败' });
  }
});

// 6. 更新广告
app.put('/api/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ad = req.body;
    
    await pool.execute(`
      UPDATE ads SET
        server_name = ?, area = ?, open_time = ?, expire_time = ?,
        feature = ?, exp_rate = ?, version = ?, homepage = ?,
        enable_reminder = ?, reminder_time = ?, updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `, [
      ad.server_name,
      ad.area,
      new Date(ad.open_time).toISOString().slice(0, 19).replace('T', ' '),
      new Date(ad.expire_time).toISOString().slice(0, 19).replace('T', ' '),
      ad.feature,
      ad.exp_rate,
      ad.version,
      ad.homepage,
      ad.enable_reminder ? 1 : 0,
      ad.reminder_time,
      id
    ]);
    
    res.json({ id, ...ad });
  } catch (error) {
    console.error('更新广告失败:', error);
    res.status(500).json({ error: '更新广告失败' });
  }
});

// 7. 删除单个广告
app.delete('/api/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM ads WHERE id = ?', [id]);
    res.json({ success: true, message: '广告已删除' });
  } catch (error) {
    console.error('删除广告失败:', error);
    res.status(500).json({ error: '删除广告失败' });
  }
});

// 8. 批量删除广告
app.delete('/api/ads/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供有效的广告ID列表' });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(`DELETE FROM ads WHERE id IN (${placeholders})`, ids);
    
    res.json({ success: true, message: `已删除${ids.length}条广告` });
  } catch (error) {
    console.error('批量删除失败:', error);
    res.status(500).json({ error: '批量删除失败' });
  }
});

// 9. 广告续期
app.post('/api/ads/:id/renew', async (req, res) => {
  try {
    const { id } = req.params;
    const { duration_hours, new_expire_time } = req.body;
    
    await pool.execute(`
      UPDATE ads SET
        expire_time = ?, updated_at = UTC_TIMESTAMP()
      WHERE id = ?
    `, [
      new Date(new_expire_time).toISOString().slice(0, 19).replace('T', ' '),
      id
    ]);
    
    res.json({ success: true, message: '广告已续期' });
  } catch (error) {
    console.error('广告续期失败:', error);
    res.status(500).json({ error: '广告续期失败' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // 新增JWT依赖
const { createPool } = require('mysql2/promise');
const app = express();
const port = 3000;

// JWT配置（实际生产环境建议用环境变量存储密钥）
const JWT_SECRET = 'your-secure-jwt-secret-key'; // 替换为随机安全字符串
const JWT_EXPIRES_IN = '24h';

// 数据库连接配置（强化时区设置）
const pool = createPool({
  host: 'localhost',
  user: 'root',
  password: '', // 替换为你的数据库密码
  database: 'game_ad_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00', // 强制UTC+8时区
  dateStrings: true // 日期返回字符串格式，避免解析问题
});

// 工具函数：将时间转换为UTC+8格式（修复核心时间转换问题）
const formatToUTC8 = (date) => {
  const dateObj = new Date(date);
  // 直接转换为Asia/Shanghai时区的YYYY-MM-DD HH:MM:SS格式
  return dateObj.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6');
};

// 初始化数据库表结构
async function initializeDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // 创建广告表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        server_name VARCHAR(255) NOT NULL,
        area ENUM('top_yellow', 'white_area', 'orange_area', 'green_area') NOT NULL,
        open_time DATETIME NOT NULL,
        expire_time DATETIME NOT NULL,
        feature TEXT,
        exp_rate VARCHAR(50),
        version VARCHAR(50),
        homepage VARCHAR(255),
        enable_reminder BOOLEAN DEFAULT FALSE,
        reminder_time INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 创建管理员表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 插入默认管理员账号（密码：admin123）
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.execute(`
      INSERT IGNORE INTO admin (username, password) 
      VALUES ('admin', ?)
    `, [hashedPassword]);
    
    console.log('数据库表结构初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    if (connection) {
      connection.release(); // 确保连接释放
    }
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

// 工具函数：将数据库时间转换为时间戳
const datetimeToTimestamp = (datetime) => {
  return new Date(datetime).getTime();
};

// 1. 测试路由
app.get('/api/test', (req, res) => {
  res.json({ code: 200, message: '服务器正常运行' });
});

// 2. 获取服务器当前时间（UTC+8）
app.get('/api/time', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT NOW() AS `current_time`');
    const dbTime = new Date(rows[0].current_time);
    
    res.json({
      currentTime: dbTime.toISOString(),
      timestamp: dbTime.getTime(),
      timezone: 'UTC+8',
      db_raw_time: rows[0].current_time
    });
  } catch (error) {
    console.error('获取服务器时间失败:', error);
    res.status(500).json({ 
      error: '获取服务器时间失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 3. 管理员登录（修复令牌安全问题）
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }
    
    const [rows] = await pool.execute('SELECT * FROM admin WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, rows[0].password);
    if (isPasswordValid) {
      // 生成JWT令牌
      const token = jwt.sign(
        { username: rows[0].username, id: rows[0].id },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      res.json({ message: '登录成功', token });
    } else {
      res.status(401).json({ error: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ 
      error: '登录失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 4. 获取广告列表
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
    
    if (search) {
      query += ` AND (server_name LIKE ? OR feature LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }
    
    if (area) {
      query += ` AND area = ?`;
      params.push(area);
    }
    
    if (status) {
      const [timeRows] = await pool.execute('SELECT NOW() AS `now`');
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
    
    query += ` ORDER BY open_time DESC`;
    
    const [rows] = await pool.execute(query, params);
    
    const ads = rows.map(ad => ({
      id: ad.id,
      server_name: ad.server_name,
      area: ad.area,
      originalOpenTime: datetimeToTimestamp(ad.open_time),
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
    res.status(500).json({ 
      error: '获取广告列表失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 5. 新增广告（批量）- 添加area验证
app.post('/api/ads/batch', async (req, res) => {
  let connection;
  try {
    const ads = req.body;
    const validAreas = ['top_yellow', 'white_area', 'orange_area', 'green_area']; // 有效区域值
    
    if (!Array.isArray(ads) || ads.length === 0) {
      return res.status(400).json({ error: '请提供有效的广告数据' });
    }
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const results = [];
    for (const ad of ads) {
      // 验证必填字段
      if (!ad.server_name || !ad.area || !ad.open_time || !ad.expire_time) {
        await connection.rollback();
        return res.status(400).json({ error: '广告数据缺少必填字段（服务器名、区域、开始/结束时间）' });
      }
      
      // 验证区域值有效性
      if (!validAreas.includes(ad.area)) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `无效的区域值: ${ad.area}，允许值：${validAreas.join(', ')}` 
        });
      }
      
      const [result] = await connection.execute(`
        INSERT INTO ads (
          server_name, area, open_time, expire_time, 
          feature, exp_rate, version, homepage, 
          enable_reminder, reminder_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ad.server_name,
        ad.area,
        formatToUTC8(ad.open_time),  // 使用修复后的时间转换
        formatToUTC8(ad.expire_time),// 使用修复后的时间转换
        ad.feature || '',
        ad.exp_rate || '',
        ad.version || '',
        ad.homepage || '',
        ad.enable_reminder ? 1 : 0,
        ad.reminder_time || null
      ]);
      
      results.push({ id: result.insertId, ...ad });
    }
    
    await connection.commit();
    res.status(201).json(results);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('新增广告失败:', error);
    res.status(500).json({ 
      error: '新增广告失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// 6. 更新广告 - 添加area验证
app.put('/api/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ad = req.body;
    const validAreas = ['top_yellow', 'white_area', 'orange_area', 'green_area']; // 有效区域值
    
    // 验证必填字段
    if (!id || !ad.server_name || !ad.area || !ad.open_time || !ad.expire_time) {
      return res.status(400).json({ error: '缺少必要的广告数据（服务器名、区域、开始/结束时间）' });
    }
    
    // 验证区域值有效性
    if (!validAreas.includes(ad.area)) {
      return res.status(400).json({ 
        error: `无效的区域值: ${ad.area}，允许值：${validAreas.join(', ')}` 
      });
    }
    
    await pool.execute(`
      UPDATE ads SET
        server_name = ?, area = ?, open_time = ?, expire_time = ?,
        feature = ?, exp_rate = ?, version = ?, homepage = ?,
        enable_reminder = ?, reminder_time = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      ad.server_name,
      ad.area,
      formatToUTC8(ad.open_time),  // 使用修复后的时间转换
      formatToUTC8(ad.expire_time),// 使用修复后的时间转换
      ad.feature || '',
      ad.exp_rate || '',
      ad.version || '',
      ad.homepage || '',
      ad.enable_reminder ? 1 : 0,
      ad.reminder_time || null,
      id
    ]);
    
    res.json({ id, ...ad });
  } catch (error) {
    console.error('更新广告失败:', error);
    res.status(500).json({ 
      error: '更新广告失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 7. 批量删除广告
app.delete('/api/ads/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供有效的广告ID列表' });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(`DELETE FROM ads WHERE id IN (${placeholders})`, ids);
    
    res.json({ 
      success: true, 
      message: `已删除${result.affectedRows}条广告` 
    });
  } catch (error) {
    console.error('批量删除失败:', error);
    res.status(500).json({ 
      error: '批量删除失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 8. 删除单个广告
app.delete('/api/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: '请提供广告ID' });
    }
    
    const [result] = await pool.execute('DELETE FROM ads WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '未找到该广告' });
    }
    
    res.json({ success: true, message: '广告已删除' });
  } catch (error) {
    console.error('删除广告失败:', error);
    res.status(500).json({ 
      error: '删除广告失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 9. 广告续期
app.post('/api/ads/:id/renew', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_expire_time } = req.body;
    
    if (!id || !new_expire_time) {
      return res.status(400).json({ error: '请提供广告ID和新的过期时间' });
    }
    
    // 验证广告是否存在
    const [exists] = await pool.execute('SELECT id FROM ads WHERE id = ?', [id]);
    if (exists.length === 0) {
      return res.status(404).json({ error: '未找到该广告' });
    }
    
    await pool.execute(`
      UPDATE ads SET
        expire_time = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      formatToUTC8(new_expire_time),  // 使用修复后的时间转换
      id
    ]);
    
    res.json({ success: true, message: '广告已续期' });
  } catch (error) {
    console.error('广告续期失败:', error);
    res.status(500).json({ 
      error: '广告续期失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 10. 时区验证接口
app.get('/api/verify-timezone', async (req, res) => {
  try {
    // 查询数据库时区配置
    const [timezoneRows] = await pool.execute(
      'SELECT @@global.time_zone AS global_tz, @@session.time_zone AS session_tz'
    );
    // 查询当前时间
    const [timeRows] = await pool.execute(
      'SELECT NOW() AS `db_time`, UNIX_TIMESTAMP(NOW()) AS `timestamp`'
    );
    
    res.json({
      database_timezone: timezoneRows[0],
      current_db_time: timeRows[0].db_time,
      current_timestamp: timeRows[0].timestamp,
      local_utc8_time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    });
  } catch (error) {
    res.status(500).json({ 
      error: '时区验证失败', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 11. 批量续期广告
app.post('/api/ads/batch/renew', async (req, res) => {
  let connection;
  try {
    const { ids, duration_hours } = req.body;
    
    // 验证参数
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供有效的广告ID列表' });
    }
    
    if (!duration_hours || isNaN(duration_hours) || duration_hours <= 0) {
      return res.status(400).json({ error: '请提供有效的续期时长（小时）' });
    }
    
    // 获取数据库当前时间（UTC+8）
    const [timeRows] = await pool.execute('SELECT NOW() AS `current_time`');
    const currentTime = timeRows[0].current_time;
    
    // 使用事务确保批量操作原子性
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // 构建批量更新SQL
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await connection.execute(`
      UPDATE ads 
      SET expire_time = IF(
        expire_time > NOW(),  -- 如果当前过期时间在未来
        DATE_ADD(expire_time, INTERVAL ? HOUR),  -- 原时间基础上增加
        DATE_ADD(NOW(), INTERVAL ? HOUR)  -- 否则从当前时间开始增加
      ),
      updated_at = NOW()
      WHERE id IN (${placeholders})
    `, [duration_hours, duration_hours, ...ids]);
    
    await connection.commit();
    
    res.json({ 
      success: true, 
      message: `已为${result.affectedRows}条广告续期${duration_hours}小时`,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('批量续期失败:', error);
    res.status(500).json({ 
      error: '批量续期失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
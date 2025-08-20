require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createPool } = require('mysql2/promise');
const app = express();
const port = process.env.PORT || 3000;

// 安全配置 - 从环境变量读取敏感信息
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only'; // 生产环境必须通过环境变量设置
const JWT_EXPIRES_IN = '24h';

// 数据库连接配置
const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'game_ad_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00', // 强制UTC+8时区
  dateStrings: true
});

// JWT验证中间件
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供有效的身份令牌' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT验证失败:', error.message);
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
};

// 工具函数：将时间转换为UTC+8格式（修复版）
const formatToUTC8 = (date) => {
  const dateObj = new Date(date);
  
  // 验证日期有效性
  if (isNaN(dateObj.getTime())) {
    throw new Error('无效的日期格式');
  }
  
  // 手动构建YYYY-MM-DD HH:MM:SS格式
  return [
    dateObj.getFullYear(),
    String(dateObj.getMonth() + 1).padStart(2, '0'),
    String(dateObj.getDate()).padStart(2, '0')
  ].join('-') + ' ' + [
    String(dateObj.getHours()).padStart(2, '0'),
    String(dateObj.getMinutes()).padStart(2, '0'),
    String(dateObj.getSeconds()).padStart(2, '0')
  ].join(':');
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        first_login BOOLEAN DEFAULT TRUE
      )
    `);
    
    console.log('数据库表结构初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 初始化管理员账号（单独函数，便于后续扩展）
async function initializeAdminAccount() {
  // 仅在开发环境自动创建默认管理员
  if (process.env.NODE_ENV === 'development') {
    let connection;
    try {
      connection = await pool.getConnection();
      
      // 检查是否已有管理员账号
      const [rows] = await connection.execute('SELECT id FROM admin LIMIT 1');
      
      if (rows.length === 0) {
        // 开发环境创建默认管理员（生产环境应手动创建）
        const defaultPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        await connection.execute(`
          INSERT INTO admin (username, password) 
          VALUES ('admin', ?)
        `, [hashedPassword]);
        
        console.log('开发环境：已创建默认管理员账号 (username: admin, password: admin123)');
        console.log('生产环境请手动创建管理员账号并删除默认账号');
      }
    } catch (error) {
      console.error('管理员账号初始化失败:', error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}

// 初始化数据库和管理员账号
initializeDatabase().then(() => {
  initializeAdminAccount();
});

// 中间件配置
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// 工具函数：将数据库时间转换为时间戳
const datetimeToTimestamp = (datetime) => {
  return new Date(datetime).getTime();
};

// 1. 测试路由
app.get('/api/test', (req, res) => {
  res.json({ code: 200, message: '服务器正常运行', timestamp: Date.now() });
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

// 3. 管理员登录
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
      // 更新最后登录时间
      await pool.execute(
        'UPDATE admin SET last_login = NOW(), first_login = FALSE WHERE id = ?',
        [rows[0].id]
      );
      
      // 生成JWT令牌
      const token = jwt.sign(
        { username: rows[0].username, id: rows[0].id },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      res.json({ 
        message: '登录成功', 
        token,
        firstLogin: rows[0].first_login || false
      });
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

// 4. 修改密码（新增）
app.post('/api/admin/change-password', authenticateJWT, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const adminId = req.user.id;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: '请输入旧密码和新密码' });
    }
    
    // 验证密码强度
    if (newPassword.length < 8) {
      return res.status(400).json({ error: '新密码长度不能少于8个字符' });
    }
    
    // 获取当前管理员信息
    const [rows] = await pool.execute('SELECT * FROM admin WHERE id = ?', [adminId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '管理员不存在' });
    }
    
    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, rows[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '旧密码不正确' });
    }
    
    // 加密新密码并更新
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE admin SET password = ?, first_login = FALSE WHERE id = ?',
      [hashedPassword, adminId]
    );
    
    res.json({ message: '密码修改成功，请重新登录' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ 
      error: '修改密码失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 5. 获取广告列表（需认证）
app.get('/api/ads', authenticateJWT, async (req, res) => {
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

// 6. 新增广告（批量）
app.post('/api/ads/batch', authenticateJWT, async (req, res) => {
  let connection;
  try {
    const ads = req.body;
    const validAreas = ['top_yellow', 'white_area', 'orange_area', 'green_area'];
    
    if (!Array.isArray(ads) || ads.length === 0) {
      return res.status(400).json({ error: '请提供有效的广告数据' });
    }
    
    // 限制批量操作数量，防止恶意请求
    if (ads.length > 50) {
      return res.status(400).json({ error: '批量操作数量不能超过50条' });
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
      
      // 验证服务器名
      if (ad.server_name.length > 100) {
        await connection.rollback();
        return res.status(400).json({ error: '服务器名长度不能超过100个字符' });
      }
      
      // 验证广告特性长度
      if (ad.feature && ad.feature.length > 200) {
        await connection.rollback();
        return res.status(400).json({ error: '广告特性不能超过200个字符' });
      }
      
      // 验证区域值有效性
      if (!validAreas.includes(ad.area)) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `无效的区域值: ${ad.area}，允许值：${validAreas.join(', ')}` 
        });
      }
      
      // 验证时间有效性
      const openTime = new Date(ad.open_time);
      const expireTime = new Date(ad.expire_time);
      const now = new Date();
      
      if (isNaN(openTime.getTime()) || isNaN(expireTime.getTime())) {
        await connection.rollback();
        return res.status(400).json({ error: '无效的时间格式' });
      }
      
      if (openTime >= expireTime) {
        await connection.rollback();
        return res.status(400).json({ error: '开始时间不能晚于结束时间' });
      }
      
      // 不能创建过期时间在当前时间之前的广告
      if (expireTime <= now) {
        await connection.rollback();
        return res.status(400).json({ error: '结束时间不能早于当前时间' });
      }
      
      try {
        const [result] = await connection.execute(`
          INSERT INTO ads (
            server_name, area, open_time, expire_time, 
            feature, exp_rate, version, homepage, 
            enable_reminder, reminder_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          ad.server_name,
          ad.area,
          formatToUTC8(ad.open_time),
          formatToUTC8(ad.expire_time),
          ad.feature || '',
          ad.exp_rate || '',
          ad.version || '',
          ad.homepage || '',
          ad.enable_reminder ? 1 : 0,
          ad.reminder_time || null
        ]);
        
        results.push({ id: result.insertId, ...ad });
      } catch (insertError) {
        await connection.rollback();
        throw insertError;
      }
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

// 7. 更新广告
app.put('/api/ads/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const ad = req.body;
    const validAreas = ['top_yellow', 'white_area', 'orange_area', 'green_area'];
    
    // 验证参数
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: '请提供有效的广告ID' });
    }
    
    // 验证必填字段
    if (!ad.server_name || !ad.area || !ad.open_time || !ad.expire_time) {
      return res.status(400).json({ error: '缺少必要的广告数据（服务器名、区域、开始/结束时间）' });
    }
    
    // 验证服务器名
    if (ad.server_name.length > 100) {
      return res.status(400).json({ error: '服务器名长度不能超过100个字符' });
    }
    
    // 验证广告特性长度
    if (ad.feature && ad.feature.length > 200) {
      return res.status(400).json({ error: '广告特性不能超过200个字符' });
    }
    
    // 验证区域值有效性
    if (!validAreas.includes(ad.area)) {
      return res.status(400).json({ 
        error: `无效的区域值: ${ad.area}，允许值：${validAreas.join(', ')}` 
      });
    }
    
    // 验证时间有效性
    const openTime = new Date(ad.open_time);
    const expireTime = new Date(ad.expire_time);
    
    if (isNaN(openTime.getTime()) || isNaN(expireTime.getTime())) {
      return res.status(400).json({ error: '无效的时间格式' });
    }
    
    if (openTime >= expireTime) {
      return res.status(400).json({ error: '开始时间不能晚于结束时间' });
    }
    
    // 检查广告是否存在
    const [exists] = await pool.execute('SELECT id FROM ads WHERE id = ?', [id]);
    if (exists.length === 0) {
      return res.status(404).json({ error: '未找到该广告' });
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
      formatToUTC8(ad.open_time),
      formatToUTC8(ad.expire_time),
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

// 8. 批量删除广告
app.delete('/api/ads/batch', authenticateJWT, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供有效的广告ID列表' });
    }
    
    // 过滤并验证ID
    const validIds = ids.filter(id => !isNaN(id) && id > 0);
    if (validIds.length === 0) {
      return res.status(400).json({ error: '请提供有效的广告ID' });
    }
    
    // 限制批量操作数量
    if (validIds.length > 100) {
      return res.status(400).json({ error: '批量操作数量不能超过100条' });
    }
    
    const placeholders = validIds.map(() => '?').join(',');
    const [result] = await pool.execute(`DELETE FROM ads WHERE id IN (${placeholders})`, validIds);
    
    res.json({ 
      success: true, 
      message: `已删除${result.affectedRows}条广告`,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('批量删除失败:', error);
    res.status(500).json({ 
      error: '批量删除失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 9. 删除单个广告
app.delete('/api/ads/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: '请提供有效的广告ID' });
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

// 10. 广告续期
app.post('/api/ads/:id/renew', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_expire_time } = req.body;
    
    if (!id || isNaN(id) || !new_expire_time) {
      return res.status(400).json({ error: '请提供有效的广告ID和新的过期时间' });
    }
    
    // 验证新过期时间
    const newExpireTime = new Date(new_expire_time);
    const now = new Date();
    
    if (isNaN(newExpireTime.getTime())) {
      return res.status(400).json({ error: '无效的时间格式' });
    }
    
    if (newExpireTime <= now) {
      return res.status(400).json({ error: '新的过期时间不能早于当前时间' });
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
      formatToUTC8(new_expire_time),
      id
    ]);
    
    res.json({ 
      success: true, 
      message: '广告已续期',
      newExpireTime: newExpireTime.toISOString()
    });
  } catch (error) {
    console.error('广告续期失败:', error);
    res.status(500).json({ 
      error: '广告续期失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 11. 时区验证接口
app.get('/api/verify-timezone', authenticateJWT, async (req, res) => {
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

// 12. 批量续期广告
app.post('/api/ads/batch/renew', authenticateJWT, async (req, res) => {
  let connection;
  try {
    const { ids, duration_hours } = req.body;
    
    // 验证参数
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供有效的广告ID列表' });
    }
    
    // 过滤并验证ID
    const validIds = ids.filter(id => !isNaN(id) && id > 0);
    if (validIds.length === 0) {
      return res.status(400).json({ error: '请提供有效的广告ID' });
    }
    
    // 限制批量操作数量
    if (validIds.length > 100) {
      return res.status(400).json({ error: '批量操作数量不能超过100条' });
    }
    
    if (!duration_hours || isNaN(duration_hours) || duration_hours <= 0 || duration_hours > 720) {
      return res.status(400).json({ error: '请提供有效的续期时长（1-720小时）' });
    }
    
    // 使用事务确保批量操作原子性
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // 构建批量更新SQL
    const placeholders = validIds.map(() => '?').join(',');
    const [result] = await connection.execute(`
      UPDATE ads 
      SET expire_time = IF(
        expire_time > NOW(),  -- 如果当前过期时间在未来
        DATE_ADD(expire_time, INTERVAL ? HOUR),  -- 原时间基础上增加
        DATE_ADD(NOW(), INTERVAL ? HOUR)  -- 否则从当前时间开始增加
      ),
      updated_at = NOW()
      WHERE id IN (${placeholders})
    `, [duration_hours, duration_hours, ...validIds]);
    
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

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`当前环境: ${process.env.NODE_ENV || 'development'}`);
});

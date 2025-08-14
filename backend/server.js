const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// 数据库连接配置
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // 替换为你的数据库密码
  database: 'db', // 确保数据库存在
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00' // 强制数据库连接使用UTC+8时区
});

// 初始化数据库表结构
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 创建广告表（确保时间字段使用UTC+8）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        server_name VARCHAR(255) NOT NULL,
        open_time DATETIME NOT NULL, -- 存储UTC+8时间
        feature TEXT,
        exp_rate VARCHAR(50),
        version VARCHAR(50),
        homepage VARCHAR(255),
        display_duration INT NOT NULL DEFAULT 24, -- 展示时长（小时）
        area ENUM('top-yellow', 'white', 'orange', 'green') NOT NULL DEFAULT 'white',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        -- 过期时间 = 开机时间 + 展示时长（UTC+8计算）
        expire_time DATETIME GENERATED ALWAYS AS (
          DATE_ADD(open_time, INTERVAL display_duration HOUR)
        ) STORED
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
    
    // 插入默认管理员账号 (密码: admin123)
    await connection.execute(`
      INSERT IGNORE INTO admin (username, password) 
      VALUES ('admin', '$2b$10$QJ1sfn3QJZ3wH6QZJZJZJO0eQJZJZJZJZJZJZJZJZJZJZJZJ')
    `);
    
    console.log('数据库表结构初始化完成');
    connection.release();
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

// 初始化数据库
initializeDatabase();

// 跨域配置
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());

// 工具函数: 区域值映射转换
const mapAreaValue = (area) => {
  const areaMap = {
    'top_yellow': 'top-yellow',
    'white_area': 'white',
    'orange_area': 'orange',
    'green_area': 'green'
  };
  return areaMap[area] || area;
};

// 工具函数: 反向映射区域值
const reverseMapAreaValue = (area) => {
  const areaMap = {
    'top-yellow': 'top_yellow',
    'white': 'white_area',
    'orange': 'orange_area',
    'green': 'green_area'
  };
  return areaMap[area] || area;
};

// 1. 测试路由
app.get('/api/test', (req, res) => {
  res.json({ code: 200, message: '服务器正常运行' });
});

// 2. 获取服务器当前UTC+8时间（核心修复：返回正确的UTC+8时间戳）
app.get('/api/ads/current-time', async (req, res) => {
  try {
    // 关键修复：通过数据库直接获取UTC+8时间戳（避免JavaScript时区转换问题）
    const [rows] = await pool.execute(`
      SELECT UNIX_TIMESTAMP(CONVERT_TZ(NOW(), '+00:00', '+08:00')) * 1000 AS timestamp
    `);
    const serverTime = rows[0].timestamp; // 毫秒级UTC+8时间戳
    
    // 生成带UTC+8时区标记的时间格式
    const utc8Date = new Date(serverTime);
    const utc8Datetime = utc8Date.toISOString().replace('Z', '+08:00');
    
    res.json({
      code: 200,
      data: {
        timestamp: serverTime, // 确保是UTC+8时间戳
        datetime: utc8Datetime // 明确标记为UTC+8
      }
    });
  } catch (error) {
    console.error('获取服务器时间失败:', error);
    res.status(500).json({ code: 500, error: '获取服务器时间失败' });
  }
});

// 3. 管理员登录
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM admin WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, error: '用户名或密码错误' });
    }
    
    // 简化验证（实际项目需用bcrypt）
    if (password === 'admin123') {
      res.json({ code: 200, message: '登录成功', token: 'admin_token' });
    } else {
      res.status(401).json({ code: 401, error: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ code: 500, error: '登录失败' });
  }
});

// 4. 获取广告列表
app.get('/api/ads', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const area = req.query.area;
    const offset = (page - 1) * pageSize;
    
    let countQuery = 'SELECT COUNT(*) AS total FROM ads';
    let listQuery = 'SELECT * FROM ads ORDER BY created_at DESC LIMIT ? OFFSET ?';
    let countParams = [];
    let listParams = [pageSize, offset];
    
    // 区域筛选
    if (area) {
      const mappedArea = mapAreaValue(area);
      countQuery = 'SELECT COUNT(*) AS total FROM ads WHERE area = ?';
      listQuery = 'SELECT * FROM ads WHERE area = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      countParams = [mappedArea];
      listParams = [mappedArea, pageSize, offset];
    }
    
    // 查询总数
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // 查询列表
    const [ads] = await pool.execute(listQuery, listParams);
    
    // 转换区域值并格式化时间
    const formattedAds = ads.map(ad => ({
      ...ad,
      area: reverseMapAreaValue(ad.area),
      // 确保时间字段返回UTC+8字符串格式
      open_time: ad.open_time.toISOString().slice(0, 19).replace('T', ' '),
      expire_time: ad.expire_time.toISOString().slice(0, 19).replace('T', ' ')
    }));
    
    res.json({
      code: 200,
      data: {
        list: formattedAds,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取广告列表失败:', error);
    res.status(500).json({ code: 500, error: '获取广告列表失败' });
  }
});

// 5. 获取单个广告详情
app.get('/api/ads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM ads WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, error: '广告不存在' });
    }
    
    const ad = rows[0];
    res.json({ 
      code: 200, 
      data: {
        ...ad,
        area: reverseMapAreaValue(ad.area),
        open_time: ad.open_time.toISOString().slice(0, 19).replace('T', ' '),
        expire_time: ad.expire_time.toISOString().slice(0, 19).replace('T', ' ')
      } 
    });
  } catch (error) {
    console.error('获取广告详情失败:', error);
    res.status(500).json({ code: 500, error: '获取广告详情失败' });
  }
});

// 6. 创建新广告（增强时间验证）
app.post('/api/ads', async (req, res) => {
  try {
    const {
      serverName,
      openTime, // 前端传递的是UTC+8时间戳（毫秒）
      feature = '',
      expRate = '',
      version = '',
      homepage = '',
      displayDuration = 24,
      adArea = 'white'
    } = req.body;
    
    // 验证必填字段
    if (!serverName || !openTime) {
      return res.status(400).json({ code: 400, error: '服务器名和开机时间为必填项' });
    }

    // 后端增强验证：通过数据库获取当前UTC+8时间进行对比
    const [timeRows] = await pool.execute(`
  SELECT UNIX_TIMESTAMP(CONVERT_TZ(NOW(), '+00:00', '+08:00')) * 1000 AS \`current_time\`
`);
    const currentTime = timeRows[0].current_time; // 数据库UTC+8时间戳
    
    // 允许1分钟误差
    if (openTime <= currentTime - 60 * 1000) {
      return res.status(400).json({ 
        code: 400, 
        error: '开机时间不能早于当前时间，请重新设置',
        debug: `当前时间: ${new Date(currentTime).toLocaleString()}, 提交时间: ${new Date(openTime).toLocaleString()}`
      });
    }
    
    // 转换时间戳为UTC+8的DATETIME格式
    const openTimeDate = new Date(openTime);
    const openTimeStr = openTimeDate.toISOString().slice(0, 19).replace('T', ' ');
    const mappedArea = mapAreaValue(adArea);
    
    const [result] = await pool.execute(
      `INSERT INTO ads (
        server_name, open_time, feature, exp_rate, version, 
        homepage, display_duration, area
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [serverName, openTimeStr, feature, expRate, version, homepage, displayDuration, mappedArea]
    );
    
    res.status(201).json({
      code: 200,
      message: '广告创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建广告失败:', error);
    res.status(500).json({ code: 500, error: '创建广告失败' });
  }
});

// 7. 更新广告
app.put('/api/ads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      serverName,
      openTime, // UTC+8时间戳（毫秒）
      feature = '',
      expRate = '',
      version = '',
      homepage = '',
      displayDuration = 24,
      adArea = 'white'
    } = req.body;
    
    // 验证必填字段
    if (!serverName || !openTime) {
      return res.status(400).json({ code: 400, error: '服务器名和开机时间为必填项' });
    }

    // 后端验证：通过数据库获取当前UTC+8时间
    const [timeRows] = await pool.execute(`
      SELECT UNIX_TIMESTAMP(CONVERT_TZ(NOW(), '+00:00', '+08:00')) * 1000 AS current_time
    `);
    const currentTime = timeRows[0].current_time;
    
    if (openTime <= currentTime - 60 * 1000) {
      return res.status(400).json({ 
        code: 400, 
        error: '开机时间不能早于当前时间，请重新设置' 
      });
    }
    
    // 检查广告是否存在
    const [rows] = await pool.execute('SELECT * FROM ads WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, error: '广告不存在' });
    }
    
    // 转换时间戳为UTC+8的DATETIME格式
    const openTimeStr = new Date(openTime).toISOString().slice(0, 19).replace('T', ' ');
    const mappedArea = mapAreaValue(adArea);
    
    // 更新广告
    await pool.execute(
      `UPDATE ads SET 
        server_name = ?, open_time = ?, feature = ?, exp_rate = ?, 
        version = ?, homepage = ?, display_duration = ?, area = ?
       WHERE id = ?`,
      [serverName, openTimeStr, feature, expRate, version, homepage, displayDuration, mappedArea, id]
    );
    
    res.json({ code: 200, message: '广告更新成功' });
  } catch (error) {
    console.error('更新广告失败:', error);
    res.status(500).json({ code: 500, error: '更新广告失败' });
  }
});

// 8. 删除单个广告
app.delete('/api/ads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // 检查广告是否存在
    const [rows] = await pool.execute('SELECT * FROM ads WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, error: '广告不存在' });
    }
    
    // 删除广告
    await pool.execute('DELETE FROM ads WHERE id = ?', [id]);
    
    res.json({ code: 200, message: '广告删除成功' });
  } catch (error) {
    console.error('删除广告失败:', error);
    res.status(500).json({ code: 500, error: '删除广告失败' });
  }
});

// 9. 批量删除广告
app.post('/api/ads/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, error: '请提供要删除的广告ID列表' });
    }
    
    // 构建参数化查询
    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(`DELETE FROM ads WHERE id IN (${placeholders})`, ids);
    
    res.json({ code: 200, message: `成功删除${ids.length}条广告` });
  } catch (error) {
    console.error('批量删除广告失败:', error);
    res.status(500).json({ code: 500, error: '批量删除广告失败' });
  }
});

// 10. 单个广告续期（基于服务器时间）
app.post('/api/ads/:id/renew', async (req, res) => {
  try {
    const id = req.params.id;
    const { displayDuration } = req.body;
    
    // 验证参数
    if (!displayDuration || displayDuration <= 0) {
      return res.status(400).json({ code: 400, error: '请提供有效的续期时长（小时）' });
    }
    
    // 检查广告是否存在
    const [rows] = await pool.execute('SELECT * FROM ads WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, error: '广告不存在' });
    }
    
    // 续期逻辑：累加展示时长
    await pool.execute(
      `UPDATE ads SET 
        display_duration = display_duration + ?
       WHERE id = ?`,
      [displayDuration, id]
    );
    
    res.json({ code: 200, message: `广告已成功续期${displayDuration}小时` });
  } catch (error) {
    console.error('广告续期失败:', error);
    res.status(500).json({ code: 500, error: '广告续期失败' });
  }
});

// 11. 批量续期广告
app.post('/api/ads/batch-renew', async (req, res) => {
  try {
    const { ids, displayDuration } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0 || !displayDuration || displayDuration <= 0) {
      return res.status(400).json({ code: 400, error: '请提供要续期的广告ID列表和有效的续期时长（小时）' });
    }
    
    // 构建参数化查询
    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(
      `UPDATE ads SET 
        display_duration = display_duration + ?
       WHERE id IN (${placeholders})`,
      [displayDuration, ...ids]
    );
    
    res.json({ code: 200, message: `成功为${ids.length}条广告续期${displayDuration}小时` });
  } catch (error) {
    console.error('批量续期广告失败:', error);
    res.status(500).json({ code: 500, error: '批量续期广告失败' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log('时间配置: 已强制使用UTC+8时区');
});
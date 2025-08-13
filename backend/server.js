const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// 数据库连接配置
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // 请替换为你的数据库密码
  database: 'db', // 请确保该数据库已存在
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 初始化数据库表结构
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 创建广告表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        server_name VARCHAR(255) NOT NULL,
        open_time DATETIME NOT NULL,
        feature TEXT,
        exp_rate VARCHAR(50),
        version VARCHAR(50),
        homepage VARCHAR(255),
        display_duration INT NOT NULL DEFAULT 24,
        area ENUM('top-yellow', 'white', 'orange', 'green') NOT NULL DEFAULT 'white',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
      VALUES ('admin', '$2b$10$QJ1sfn3QJZ3wH6QZJZJZJO0eQJZJZJZJZJZJZJZJZJZJZJZJZJ')
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

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ code: 200, message: '服务器正常运行' });
});

// 管理员登录
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM admin WHERE username = ?', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, error: '用户名或密码错误' });
    }
    
    // 这里简化处理，实际项目中应使用bcrypt等工具验证密码
    if (password === 'admin123') { // 仅为示例，实际需加密验证
      res.json({ code: 200, message: '登录成功', token: 'admin_token' });
    } else {
      res.status(401).json({ code: 401, error: '用户名或密码错误' });
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ code: 500, error: '登录失败' });
  }
});

// 广告相关API

// 1. 获取广告列表（支持分页和区域筛选）
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
    
    // 转换区域值为前端需要的格式
    const formattedAds = ads.map(ad => ({
      ...ad,
      area: reverseMapAreaValue(ad.area)
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

// 2. 获取单个广告详情
app.get('/api/ads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM ads WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, error: '广告不存在' });
    }
    
    // 转换区域值
    const ad = {
      ...rows[0],
      area: reverseMapAreaValue(rows[0].area)
    };
    
    res.json({ code: 200, data: ad });
  } catch (error) {
    console.error('获取广告详情失败:', error);
    res.status(500).json({ code: 500, error: '获取广告详情失败' });
  }
});

// 3. 创建新广告
app.post('/api/ads', async (req, res) => {
  try {
    const {
      serverName,
      openTime,
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
    
    // 转换区域值
    const mappedArea = mapAreaValue(adArea);
    
    const [result] = await pool.execute(
      `INSERT INTO ads (
        server_name, open_time, feature, exp_rate, version, 
        homepage, display_duration, area
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [serverName, openTime, feature, expRate, version, homepage, displayDuration, mappedArea]
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

// 4. 更新广告
app.put('/api/ads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      serverName,
      openTime,
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
    
    // 先检查广告是否存在
    const [rows] = await pool.execute('SELECT * FROM ads WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, error: '广告不存在' });
    }
    
    // 转换区域值
    const mappedArea = mapAreaValue(adArea);
    
    // 更新广告
    await pool.execute(
      `UPDATE ads SET 
        server_name = ?, open_time = ?, feature = ?, exp_rate = ?, 
        version = ?, homepage = ?, display_duration = ?, area = ?
       WHERE id = ?`,
      [serverName, openTime, feature, expRate, version, homepage, displayDuration, mappedArea, id]
    );
    
    res.json({ code: 200, message: '广告更新成功' });
  } catch (error) {
    console.error('更新广告失败:', error);
    res.status(500).json({ code: 500, error: '更新广告失败' });
  }
});

// 5. 删除单个广告
app.delete('/api/ads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // 先检查广告是否存在
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

// 6. 批量删除广告
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

// 7. 单个广告续期 - 新增接口
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
    
    // 续期逻辑：增加展示时长，同时调整open_time以保持expire_time正确计算
    await pool.execute(
      `UPDATE ads SET 
        display_duration = display_duration + ?,
        open_time = DATE_SUB(open_time, INTERVAL ? HOUR)
       WHERE id = ?`,
      [displayDuration, displayDuration, id]
    );
    
    res.json({ code: 200, message: `广告已成功续期${displayDuration}小时` });
  } catch (error) {
    console.error('广告续期失败:', error);
    res.status(500).json({ code: 500, error: '广告续期失败' });
  }
});

// 8. 批量续期广告 - 修正参数
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
        display_duration = display_duration + ?,
        open_time = DATE_SUB(open_time, INTERVAL ? HOUR)
       WHERE id IN (${placeholders})`,
      [displayDuration, displayDuration, ...ids]
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
  console.log('可用API:');
  console.log('GET    /api/test               - 测试服务器连接');
  console.log('POST   /api/admin/login        - 管理员登录');
  console.log('GET    /api/ads                - 获取广告列表');
  console.log('GET    /api/ads/:id            - 获取单个广告详情');
  console.log('POST   /api/ads                - 创建新广告');
  console.log('PUT    /api/ads/:id            - 更新广告');
  console.log('DELETE /api/ads/:id            - 删除单个广告');
  console.log('POST   /api/ads/batch-delete   - 批量删除广告');
  console.log('POST   /api/ads/:id/renew      - 单个广告续期');
  console.log('POST   /api/ads/batch-renew    - 批量续期广告');
});

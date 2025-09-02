const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { asyncHandler, handleValidationErrors } = require('../middleware/errorHandler');
const { Ad } = require('../models');

// Placeholder for auth middleware (will be implemented later)
const authMiddleware = (req, res, next) => next();

/**
 * @route   GET /api/v1/ads
 * @desc    Get all ads with pagination and filtering
 * @access  Public
 */
router.get('/', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('region').optional().isIn(['yellow', 'white', 'lightYellow', 'cyan']).withMessage('Invalid region'),
    query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
    query('sort').optional().isIn(['sort_weight', 'create_time', 'title']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, region, status, sort = 'sort_weight', order = 'desc' } = req.query;
    
    // 构建查询条件
    const whereClause = {};
    if (region) whereClause.region = region;
    if (status) whereClause.status = status;
    
    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // 查询广告数据
    const { count, rows: ads } = await Ad.findAndCountAll({
      where: whereClause,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: {
        ads: ads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  })
);

/**
 * @route   GET /api/v1/ads/frontend
 * @desc    Get ads in frontend format (JavaScript array format)
 * @access  Public
 */
router.get('/frontend', 
  asyncHandler(async (req, res) => {
    try {
      // 获取所有活跃的广告，按区域和排序权重排序
      const ads = await Ad.findAll({
        where: { status: 'active' },
        order: [
          ['region', 'ASC'],
          ['sort_weight', 'DESC'],
          ['create_time', 'ASC']
        ]
      });

      // 按区域分组
      const yellowAds = ads.filter(ad => ad.region === 'yellow');
      const whiteAds = ads.filter(ad => ad.region === 'white');
      const lightYellowAds = ads.filter(ad => ad.region === 'lightYellow');
      const cyanAds = ads.filter(ad => ad.region === 'cyan');

      // 生成首页格式的JavaScript代码
      let jsCode = '';

      // 黄色区域广告
      if (yellowAds.length > 0) {
        jsCode += `theAds=Array(${Math.max(20, yellowAds.length)}).fill('');\n`;
        jsCode += `shu = ${yellowAds.length}\n`;
        jsCode += `dot=''\n\n`;
        
        yellowAds.forEach((ad, index) => {
          const bgColor = '#FFFF00';
          const hoverColor = '#B0E0E6';
          const startTime = ad.startTime || '今日新区';
          const experience = ad.experience || '特色专区';
          const version = ad.version || '1.03H';
          
          jsCode += `theAds[${index + 1}]='<TR bgColor=${bgColor} onmouseover=javascript:this.bgColor="${hoverColor}" onmouseout=javascript:this.bgColor="${bgColor}"><TD>&nbsp;<a href="${ad.link}" target=_blank><font color=red >${ad.title}</font></a></TD><TD align=center><font color=red>${startTime}&nbsp;品牌强力推荐</font></TD><TD><font color=red>&nbsp;${ad.content}</font></TD><TD align=center><font color=red>${experience}</font></TD><TD align=center><font color=red>${version}</font></TD><TD align=center><a href="${ad.link}" target=_blank><font color=red>点击查看</font></a></TD></tr>'\n`;
        });
        
        jsCode += `\ntheAds2='';\n`;
        jsCode += `var idx;\n`;
        jsCode += `theAds = theAds.sort(function(){return Math.random()*new Date%3-1;});\n`;
        jsCode += `for(idx = 0; idx < shu; idx++){\n`;
        jsCode += `  document.write(dot+theAds[idx]);\n`;
        jsCode += `}\n`;
        jsCode += `document.write(dot+theAds2);\n\n`;
      }

      // 白色区域广告
      if (whiteAds.length > 0) {
        jsCode += `theAds=Array(${Math.max(145, whiteAds.length)}).fill('');\n`;
        jsCode += `shu = ${whiteAds.length}\n`;
        jsCode += `dot=''\n\n`;
        
        whiteAds.forEach((ad, index) => {
          const bgColor = '#FFFFFF';
          const hoverColor = '#B0E0E6';
          const startTime = ad.startTime || '今日新区';
          const experience = ad.experience || '特色专区';
          const version = ad.version || '1.03H';
          
          jsCode += `theAds[${index + 1}]='<TR bgColor=${bgColor} onmouseover=javascript:this.bgColor="${hoverColor}" onmouseout=javascript:this.bgColor="${bgColor}"><TD>&nbsp;<a href="${ad.link}" target=_blank><font color=red >${ad.title}</font></a></TD><TD align=center><font color=red>${startTime}&nbsp;品牌强力推荐</font></TD><TD><font color=red>&nbsp;${ad.content}</font></TD><TD align=center><font color=red>${experience}</font></TD><TD align=center><font color=red>${version}</font></TD><TD align=center><a href="${ad.link}" target=_blank><font color=red>点击查看</font></a></TD></tr>'\n`;
        });
        
        jsCode += `\ntheAds2='';\n`;
        jsCode += `var idx;\n`;
        jsCode += `theAds = theAds.sort(function(){return Math.random()*new Date%3-1;});\n`;
        jsCode += `for(idx = 0; idx < shu; idx++){\n`;
        jsCode += `  document.write(dot+theAds[idx]);\n`;
        jsCode += `}\n`;
        jsCode += `document.write(dot+theAds2);\n\n`;
      }

      // 浅黄色区域广告
      if (lightYellowAds.length > 0) {
        jsCode += `theAds=Array(${Math.max(53, lightYellowAds.length)}).fill('');\n`;
        jsCode += `shu = ${lightYellowAds.length}\n`;
        jsCode += `dot=''\n\n`;
        
        lightYellowAds.forEach((ad, index) => {
          const bgColor = '#d6ff52';
          const hoverColor = '#B0E0E6';
          const startTime = ad.startTime || '今日新区';
          const experience = ad.experience || '特色专区';
          const version = ad.version || '1.03H';
          
          jsCode += `theAds[${index + 1}]='<TR bgColor=${bgColor} onmouseover=javascript:this.bgColor="${hoverColor}" onmouseout=javascript:this.bgColor="${bgColor}"><TD>&nbsp;<a href="${ad.link}" target=_blank><font color=red >${ad.title}</font></a></TD><TD align=center><font color=red>${startTime}&nbsp;品牌强力推荐</font></TD><TD><font color=red>&nbsp;${ad.content}</font></TD><TD align=center><font color=red>${experience}</font></TD><TD align=center><font color=red>${version}</font></TD><TD align=center><a href="${ad.link}" target=_blank><font color=red>点击查看</font></a></TD></tr>'\n`;
        });
        
        jsCode += `\ntheAds2='';\n`;
        jsCode += `var idx;\n`;
        jsCode += `theAds = theAds.sort(function(){return Math.random()*new Date%3-1;});\n`;
        jsCode += `for(idx = 0; idx < shu; idx++){\n`;
        jsCode += `  document.write(dot+theAds[idx]);\n`;
        jsCode += `}\n`;
        jsCode += `document.write(dot+theAds2);\n\n`;
      }

      // 青色区域广告
      if (cyanAds.length > 0) {
        jsCode += `theAds=Array(${Math.max(67, cyanAds.length)}).fill('');\n`;
        jsCode += `shu = ${cyanAds.length}\n`;
        jsCode += `dot=''\n\n`;
        
        cyanAds.forEach((ad, index) => {
          const bgColor = '#d6ff52';
          const hoverColor = '#B0E0E6';
          const startTime = ad.startTime || '今日新区';
          const experience = ad.experience || '特色专区';
          const version = ad.version || '1.03H';
          
          jsCode += `theAds[${index + 1}]='<TR bgColor=${bgColor} onmouseover=javascript:this.bgColor="${hoverColor}" onmouseout=javascript:this.bgColor="${bgColor}"><TD>&nbsp;<a href="${ad.link}" target=_blank><font color=red >${ad.title}</font></a></TD><TD align=center><font color=red>${startTime}&nbsp;品牌强力推荐</font></TD><TD><font color=red>&nbsp;${ad.content}</font></TD><TD align=center><font color=red>${experience}</font></TD><TD align=center><font color=red>${version}</font></TD><TD align=center><a href="${ad.link}" target=_blank><font color=red>点击查看</font></a></TD></tr>'\n`;
        });
        
        jsCode += `\ntheAds2='';\n`;
        jsCode += `var idx;\n`;
        jsCode += `theAds = theAds.sort(function(){return Math.random()*new Date%3-1;});\n`;
        jsCode += `for(idx = 0; idx < shu; idx++){\n`;
        jsCode += `  document.write(dot+theAds[idx]);\n`;
        jsCode += `}\n`;
        jsCode += `document.write(dot+theAds2);\n\n`;
      }

      // 设置响应头为JavaScript
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.send(jsCode);

    } catch (error) {
      console.error('生成前端广告数据失败:', error);
      res.status(500).json({ 
        success: false, 
        error: '生成前端广告数据失败',
        details: error.message 
      });
    }
  })
);

/**
 * @route   GET /api/v1/ads/:id
 * @desc    Get single ad by ID
 * @access  Public
 */
router.get('/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // TODO: Implement database query
    const mockAd = {
      id: parseInt(id),
      server_name: '豪情奇迹',
      start_time: '8月29日',
      description: '经典复古版本，今晚首区',
      exp_rate: '300倍',
      version: '1.03H',
      link: 'http://example.com',
      highlight_level: 'yellow',
      position: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockAd
    });
  })
);

/**
 * @route   POST /api/v1/ads
 * @desc    Create new ad
 * @access  Private (Admin only)
 */
router.post('/',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('content').notEmpty().withMessage('Content is required'),
    body('link').notEmpty().isURL().withMessage('Valid URL is required'),
    body('region').notEmpty().isIn(['yellow', 'white', 'lightYellow', 'cyan']).withMessage('Invalid region'),
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('endDate').notEmpty().withMessage('End date is required'),
    body('experience').optional().isLength({ max: 100 }).withMessage('Experience must be less than 100 characters'),
    body('version').optional().isLength({ max: 100 }).withMessage('Version must be less than 100 characters'),
    body('sortWeight').optional().isInt({ min: 0 }).withMessage('Sort weight must be a non-negative integer'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const adData = req.body;
    
    // 创建新广告
    const newAd = await Ad.create({
      title: adData.title,
      content: adData.content,
      link: adData.link,
      region: adData.region,
      start_date: new Date(adData.startDate),
      end_date: new Date(adData.endDate),
      experience: adData.experience || null,
      version: adData.version || null,
      sort_weight: adData.sortWeight || 0,
      status: 'active',
      create_user: 'admin', // TODO: Get from auth
      update_user: 'admin'  // TODO: Get from auth
    });

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: newAd
    });
  })
);

/**
 * @route   PUT /api/v1/ads/:id
 * @desc    Update ad
 * @access  Private (Admin only)
 */
router.put('/:id',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
    body('server_name').optional().isLength({ max: 100 }).withMessage('Server name must be less than 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('link').optional().isURL().withMessage('Valid URL is required'),
    body('highlight_level').optional().isIn(['yellow', 'white', 'green']).withMessage('Invalid highlight level'),
    body('position').optional().isInt({ min: 1 }).withMessage('Position must be a positive integer'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    // TODO: Implement database update
    const updatedAd = {
      id: parseInt(id),
      ...updates,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: updatedAd
    });
  })
);

/**
 * @route   DELETE /api/v1/ads/:id
 * @desc    Delete ad
 * @access  Private (Admin only)
 */
router.delete('/:id',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // TODO: Implement database deletion (soft delete recommended)
    
    res.json({
      success: true,
      message: 'Ad deleted successfully',
      data: { id: parseInt(id) }
    });
  })
);

/**
 * @route   PATCH /api/v1/ads/:id/position
 * @desc    Update ad position
 * @access  Private (Admin only)
 */
router.patch('/:id/position',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
    body('position').notEmpty().isInt({ min: 1 }).withMessage('Position must be a positive integer')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { position } = req.body;
    
    // TODO: Implement position update logic
    
    res.json({
      success: true,
      message: 'Ad position updated successfully',
      data: { id: parseInt(id), position }
    });
  })
);



module.exports = router;
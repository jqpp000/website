const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { asyncHandler, handleValidationErrors } = require('../middleware/errorHandler');

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
    query('category').optional().isString().withMessage('Category must be a string'),
    query('highlight').optional().isIn(['yellow', 'white', 'green']).withMessage('Invalid highlight level'),
    query('sort').optional().isIn(['position', 'created_at', 'server_name']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    // TODO: Implement database query
    const { page = 1, limit = 20, category, highlight, sort = 'position', order = 'asc' } = req.query;
    
    // Mock data for now
    const mockAds = [
      {
        id: 1,
        server_name: '豪情奇迹',
        start_time: '8月29日',
        description: '经典复古版本，今晚首区',
        exp_rate: '300倍',
        version: '1.03H',
        link: 'http://example.com',
        highlight_level: 'yellow',
        position: 1,
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: {
        ads: mockAds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockAds.length,
          pages: 1
        }
      }
    });
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
    body('server_name').notEmpty().withMessage('Server name is required')
      .isLength({ max: 100 }).withMessage('Server name must be less than 100 characters'),
    body('start_time').notEmpty().withMessage('Start time is required'),
    body('description').notEmpty().withMessage('Description is required')
      .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('exp_rate').notEmpty().withMessage('Experience rate is required'),
    body('version').notEmpty().withMessage('Version is required'),
    body('link').notEmpty().isURL().withMessage('Valid URL is required'),
    body('highlight_level').optional().isIn(['yellow', 'white', 'green']).withMessage('Invalid highlight level'),
    body('position').optional().isInt({ min: 1 }).withMessage('Position must be a positive integer'),
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const adData = req.body;
    
    // TODO: Implement database insertion
    const newAd = {
      id: Date.now(), // Temporary ID generation
      ...adData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

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
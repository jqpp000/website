module.exports = (sequelize, DataTypes) => {
  const OperationLog = sequelize.define('OperationLog', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID'
    },
    user_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '操作用户',
      references: {
        model: 'users',
        key: 'username'
      }
    },
    operation_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作类型'
    },
    operation_detail: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '操作详情'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP地址'
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '用户代理'
    },
    status: {
      type: DataTypes.ENUM('success', 'failed'),
      allowNull: false,
      defaultValue: 'success',
      comment: '操作状态'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息'
    }
  }, {
    tableName: 'operation_logs',
    comment: '操作日志表',
    indexes: [
      {
        name: 'idx_user_name',
        fields: ['user_name']
      },
      {
        name: 'idx_operation_type',
        fields: ['operation_type']
      },
      {
        name: 'idx_operation_time',
        fields: ['operation_time']
      },
      {
        name: 'idx_status',
        fields: ['status']
      }
    ]
  });

  // 类方法：记录操作日志
  OperationLog.logOperation = async function(operationData) {
    const {
      userName,
      operationType,
      operationDetail,
      ipAddress,
      userAgent,
      status = 'success',
      errorMessage = null
    } = operationData;

    return await this.create({
      user_name: userName,
      operation_type: operationType,
      operation_detail: operationDetail,
      ip_address: ipAddress,
      user_agent: userAgent,
      status,
      error_message: errorMessage
    });
  };

  // 类方法：记录登录日志
  OperationLog.logLogin = async function(userName, ipAddress, userAgent, status = 'success', errorMessage = null) {
    return await this.logOperation({
      userName,
      operationType: 'login',
      operationDetail: `用户 ${userName} 登录系统`,
      ipAddress,
      userAgent,
      status,
      errorMessage
    });
  };

  // 类方法：记录登出日志
  OperationLog.logLogout = async function(userName, ipAddress, userAgent) {
    return await this.logOperation({
      userName,
      operationType: 'logout',
      operationDetail: `用户 ${userName} 登出系统`,
      ipAddress,
      userAgent
    });
  };

  // 类方法：记录广告操作日志
  OperationLog.logAdOperation = async function(userName, operationType, adId, adTitle, ipAddress, userAgent, status = 'success', errorMessage = null) {
    const operationDetails = {
      'add': `用户 ${userName} 添加广告：${adTitle}`,
      'edit': `用户 ${userName} 编辑广告：${adTitle}`,
      'delete': `用户 ${userName} 删除广告：${adTitle}`,
      'renew': `用户 ${userName} 续费广告：${adTitle}`,
      'status_change': `用户 ${userName} 更改广告状态：${adTitle}`
    };

    return await this.logOperation({
      userName,
      operationType,
      operationDetail: operationDetails[operationType] || `用户 ${userName} 对广告 ${adTitle} 执行 ${operationType} 操作`,
      ipAddress,
      userAgent,
      status,
      errorMessage
    });
  };

  // 类方法：获取用户操作历史
  OperationLog.getUserOperations = async function(userName, limit = 100) {
    return await this.findAll({
      where: { user_name: userName },
      order: [['operation_time', 'DESC']],
      limit,
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['username', 'role']
      }]
    });
  };

  // 类方法：获取操作类型统计
  OperationLog.getOperationTypeStats = async function(startDate, endDate) {
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.operation_time = {
        [sequelize.Op.between]: [startDate, endDate]
      };
    }

    return await this.findAll({
      where: whereClause,
      attributes: [
        'operation_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "success" THEN 1 END')), 'success_count'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "failed" THEN 1 END')), 'failed_count']
      ],
      group: ['operation_type'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true
    });
  };

  // 类方法：清理旧日志
  OperationLog.cleanOldLogs = async function(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.destroy({
      where: {
        operation_time: {
          [sequelize.Op.lt]: cutoffDate
        }
      }
    });

    return result;
  };

  // 类方法：搜索操作日志
  OperationLog.searchLogs = async function(searchParams) {
    const whereClause = {};

    if (searchParams.userName) {
      whereClause.user_name = { [sequelize.Op.like]: `%${searchParams.userName}%` };
    }

    if (searchParams.operationType) {
      whereClause.operation_type = searchParams.operationType;
    }

    if (searchParams.status) {
      whereClause.status = searchParams.status;
    }

    if (searchParams.startDate && searchParams.endDate) {
      whereClause.operation_time = {
        [sequelize.Op.between]: [searchParams.startDate, searchParams.endDate]
      };
    }

    if (searchParams.ipAddress) {
      whereClause.ip_address = { [sequelize.Op.like]: `%${searchParams.ipAddress}%` };
    }

    return await this.findAll({
      where: whereClause,
      order: [['operation_time', 'DESC']],
      limit: searchParams.limit || 100,
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['username', 'role']
      }]
    });
  };

  return OperationLog;
};

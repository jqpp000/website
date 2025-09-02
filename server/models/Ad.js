module.exports = (sequelize, DataTypes) => {
  const Ad = sequelize.define('Ad', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '广告ID'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '广告标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '广告内容'
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '跳转链接'
    },
    region: {
      type: DataTypes.ENUM('yellow', 'white', 'lightYellow', 'cyan'),
      allowNull: false,
      comment: '所属区域'
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '开始时间'
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '结束时间'
    },
    experience: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '游戏经验倍数'
    },
    version: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '游戏版本'
    },
    sort_weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    },
    create_user: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '创建人'
    },
    update_user: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '更新人'
    }
  }, {
    tableName: 'ads',
    comment: '广告信息表',
    indexes: [
      {
        name: 'idx_region',
        fields: ['region']
      },
      {
        name: 'idx_status',
        fields: ['status']
      },
      {
        name: 'idx_start_date',
        fields: ['start_date']
      },
      {
        name: 'idx_end_date',
        fields: ['end_date']
      },
      {
        name: 'idx_create_time',
        fields: ['create_time']
      },
      {
        name: 'idx_region_status',
        fields: ['region', 'status']
      },
      {
        name: 'idx_date_range',
        fields: ['start_date', 'end_date']
      }
    ]
  });

  // 实例方法：检查广告是否过期
  Ad.prototype.isExpired = function() {
    return new Date() > this.end_date;
  };

  // 实例方法：检查广告是否即将过期
  Ad.prototype.isExpiringSoon = function(days = 7) {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    return this.end_date <= warningDate && this.end_date > new Date();
  };

  // 实例方法：获取剩余天数
  Ad.prototype.getRemainingDays = function() {
    const now = new Date();
    const end = new Date(this.end_date);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // 类方法：获取区域广告数量
  Ad.getRegionCount = async function(region, status = 'active') {
    return await this.count({
      where: { region, status }
    });
  };

  // 类方法：获取即将过期的广告
  Ad.getExpiringAds = async function(days = 7) {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    
    return await this.findAll({
      where: {
        status: 'active',
        end_date: {
          [sequelize.Op.lte]: warningDate,
          [sequelize.Op.gt]: new Date()
        }
      },
      order: [['end_date', 'ASC']]
    });
  };

  // 类方法：获取过期的广告
  Ad.getExpiredAds = async function() {
    return await this.findAll({
      where: {
        status: 'active',
        end_date: {
          [sequelize.Op.lt]: new Date()
        }
      },
      order: [['end_date', 'ASC']]
    });
  };

  // 类方法：搜索广告
  Ad.searchAds = async function(searchTerm, filters = {}) {
    const whereClause = {
      [sequelize.Op.or]: [
        { title: { [sequelize.Op.like]: `%${searchTerm}%` } },
        { content: { [sequelize.Op.like]: `%${searchTerm}%` } },
        { experience: { [sequelize.Op.like]: `%${searchTerm}%` } },
        { version: { [sequelize.Op.like]: `%${searchTerm}%` } }
      ]
    };

    // 添加其他过滤条件
    if (filters.region) {
      whereClause.region = filters.region;
    }
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.startDate) {
      whereClause.start_date = { [sequelize.Op.gte]: filters.startDate };
    }
    if (filters.endDate) {
      whereClause.end_date = { [sequelize.Op.lte]: filters.endDate };
    }

    return await this.findAll({
      where: whereClause,
      order: [['sort_weight', 'DESC'], ['create_time', 'DESC']]
    });
  };

  // 类方法：批量更新状态
  Ad.batchUpdateStatus = async function(ids, status, updateUser) {
    return await this.update(
      { 
        status, 
        update_user: updateUser,
        update_time: new Date()
      },
      { 
        where: { id: { [sequelize.Op.in]: ids } } 
      }
    );
  };

  // 类方法：获取统计信息
  Ad.getStatistics = async function() {
    const stats = await this.findAll({
      attributes: [
        'region',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['region', 'status'],
      raw: true
    });

    const result = {
      yellow: { active: 0, inactive: 0, total: 0 },
      white: { active: 0, inactive: 0, total: 0 },
      lightYellow: { active: 0, inactive: 0, total: 0 },
      cyan: { active: 0, inactive: 0, total: 0 }
    };

    stats.forEach(stat => {
      const region = stat.region;
      const status = stat.status;
      const count = parseInt(stat.count);
      
      result[region][status] = count;
      result[region].total += count;
    });

    return result;
  };

  return Ad;
};

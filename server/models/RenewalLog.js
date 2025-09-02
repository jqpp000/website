module.exports = (sequelize, DataTypes) => {
  const RenewalLog = sequelize.define('RenewalLog', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '续费记录ID'
    },
    ad_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '广告ID',
      references: {
        model: 'ads',
        key: 'id'
      }
    },
    old_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '续费前到期时间'
    },
    new_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '续费后到期时间'
    },
    renewal_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '续费天数'
    },
    renewal_weeks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '续费周数'
    },
    renewal_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '续费月数'
    },
    renewal_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '续费金额'
    },
    renewal_user: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '续费操作人'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注信息'
    }
  }, {
    tableName: 'renewal_logs',
    comment: '续费记录表',
    indexes: [
      {
        name: 'idx_ad_id',
        fields: ['ad_id']
      },
      {
        name: 'idx_renewal_time',
        fields: ['renewal_time']
      },
      {
        name: 'idx_renewal_user',
        fields: ['renewal_user']
      }
    ]
  });

  // 实例方法：计算续费天数
  RenewalLog.prototype.calculateRenewalDays = function() {
    const oldDate = new Date(this.old_end_date);
    const newDate = new Date(this.new_end_date);
    const diffTime = newDate - oldDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 类方法：创建续费记录
  RenewalLog.createRenewal = async function(adId, oldEndDate, newEndDate, renewalUser, options = {}) {
    const renewalDays = Math.ceil((new Date(newEndDate) - new Date(oldEndDate)) / (1000 * 60 * 60 * 24));
    
    // 计算周数和月数
    const weeks = Math.floor(renewalDays / 7);
    const months = Math.floor(renewalDays / 30);
    
    return await this.create({
      ad_id: adId,
      old_end_date: oldEndDate,
      new_end_date: newEndDate,
      renewal_days: renewalDays,
      renewal_weeks: weeks,
      renewal_months: months,
      renewal_amount: options.amount || null,
      renewal_user: renewalUser,
      remark: options.remark || null
    });
  };

  // 类方法：获取广告续费历史
  RenewalLog.getAdRenewalHistory = async function(adId) {
    return await this.findAll({
      where: { ad_id: adId },
      order: [['renewal_time', 'DESC']],
      include: [{
        model: sequelize.models.Ad,
        as: 'ad',
        attributes: ['title', 'region']
      }]
    });
  };

  // 类方法：获取用户续费记录
  RenewalLog.getUserRenewals = async function(username, limit = 50) {
    return await this.findAll({
      where: { renewal_user: username },
      order: [['renewal_time', 'DESC']],
      limit,
      include: [{
        model: sequelize.models.Ad,
        as: 'ad',
        attributes: ['title', 'region']
      }]
    });
  };

  // 类方法：获取续费统计
  RenewalLog.getRenewalStatistics = async function(startDate, endDate) {
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.renewal_time = {
        [sequelize.Op.between]: [startDate, endDate]
      };
    }

    const stats = await this.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_renewals'],
        [sequelize.fn('SUM', sequelize.col('renewal_days')), 'total_days'],
        [sequelize.fn('SUM', sequelize.col('renewal_amount')), 'total_amount'],
        [sequelize.fn('AVG', sequelize.col('renewal_days')), 'avg_days']
      ],
      raw: true
    });

    return stats[0] || {
      total_renewals: 0,
      total_days: 0,
      total_amount: 0,
      avg_days: 0
    };
  };

  return RenewalLog;
};

module.exports = (sequelize, DataTypes) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '设置ID'
    },
    setting_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '设置键'
    },
    setting_value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '设置值'
    },
    setting_type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      allowNull: false,
      defaultValue: 'string',
      comment: '设置值类型'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '设置描述'
    },
    is_editable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否可编辑'
    }
  }, {
    tableName: 'system_settings',
    comment: '系统设置表',
    indexes: [
      {
        name: 'uk_setting_key',
        unique: true,
        fields: ['setting_key']
      }
    ]
  });

  // 类方法：获取设置值
  SystemSetting.getValue = async function(key, defaultValue = null) {
    const setting = await this.findOne({ where: { setting_key: key } });
    
    if (!setting) {
      return defaultValue;
    }

    // 根据类型转换值
    switch (setting.setting_type) {
      case 'number':
        return parseFloat(setting.setting_value) || defaultValue;
      case 'boolean':
        return setting.setting_value === 'true' || setting.setting_value === '1';
      case 'json':
        try {
          return JSON.parse(setting.setting_value);
        } catch (e) {
          return defaultValue;
        }
      default:
        return setting.setting_value;
    }
  };

  // 类方法：设置值
  SystemSetting.setValue = async function(key, value, options = {}) {
    const { description, type = 'string', isEditable = true } = options;
    
    // 自动检测类型
    let detectedType = type;
    if (type === 'string') {
      if (typeof value === 'number') detectedType = 'number';
      else if (typeof value === 'boolean') detectedType = 'boolean';
      else if (typeof value === 'object') detectedType = 'json';
    }

    // 转换值为字符串
    let stringValue;
    switch (detectedType) {
      case 'json':
        stringValue = JSON.stringify(value);
        break;
      default:
        stringValue = String(value);
    }

    const [setting, created] = await this.findOrCreate({
      where: { setting_key: key },
      defaults: {
        setting_value: stringValue,
        setting_type: detectedType,
        description: description || `系统设置：${key}`,
        is_editable: isEditable
      }
    });

    if (!created) {
      // 更新现有设置
      await setting.update({
        setting_value: stringValue,
        setting_type: detectedType,
        description: description || setting.description,
        is_editable: isEditable
      });
    }

    return setting;
  };

  // 类方法：批量设置值
  SystemSetting.setMultipleValues = async function(settings) {
    const results = [];
    
    for (const [key, value] of Object.entries(settings)) {
      const result = await this.setValue(key, value.value, {
        description: value.description,
        type: value.type,
        isEditable: value.isEditable
      });
      results.push(result);
    }
    
    return results;
  };

  // 类方法：获取所有设置
  SystemSetting.getAllSettings = async function() {
    const settings = await this.findAll({
      order: [['setting_key', 'ASC']]
    });

    const result = {};
    settings.forEach(setting => {
      result[setting.setting_key] = {
        value: setting.setting_value,
        type: setting.setting_type,
        description: setting.description,
        isEditable: setting.is_editable
      };
    });

    return result;
  };

  // 类方法：删除设置
  SystemSetting.deleteSetting = async function(key) {
    const setting = await this.findOne({ where: { setting_key: key } });
    
    if (setting && !setting.is_editable) {
      throw new Error(`设置 ${key} 不可删除`);
    }
    
    if (setting) {
      await setting.destroy();
      return true;
    }
    
    return false;
  };

  // 类方法：初始化默认设置
  SystemSetting.initializeDefaults = async function() {
    const defaultSettings = {
      'expiry_warning_days': {
        value: 7,
        type: 'number',
        description: '到期提醒阈值（天）',
        isEditable: true
      },
      'page_size': {
        value: 20,
        type: 'number',
        description: '每页显示数量',
        isEditable: true
      },
      'auto_refresh_interval': {
        value: 60,
        type: 'number',
        description: '自动刷新间隔（秒）',
        isEditable: true
      },
      'max_ads_yellow': {
        value: 20,
        type: 'number',
        description: '黄色置顶区最大广告数',
        isEditable: true
      },
      'max_ads_white': {
        value: 145,
        type: 'number',
        description: '套白区域最大广告数',
        isEditable: true
      },
      'max_ads_light_yellow': {
        value: 53,
        type: 'number',
        description: '套淡黄区域最大广告数',
        isEditable: true
      },
      'max_ads_cyan': {
        value: 67,
        type: 'number',
        description: '套青区域最大广告数',
        isEditable: true
      },
      'system_name': {
        value: '58信息网广告管理系统',
        type: 'string',
        description: '系统名称',
        isEditable: false
      },
      'system_version': {
        value: '1.0.0',
        type: 'string',
        description: '系统版本',
        isEditable: false
      },
      'maintenance_mode': {
        value: false,
        type: 'boolean',
        description: '维护模式',
        isEditable: true
      }
    };

    return await this.setMultipleValues(defaultSettings);
  };

  // 类方法：获取系统信息
  SystemSetting.getSystemInfo = async function() {
    const systemInfo = await this.findAll({
      where: {
        setting_key: {
          [sequelize.Op.in]: ['system_name', 'system_version', 'maintenance_mode']
        }
      }
    });

    const result = {};
    systemInfo.forEach(setting => {
      result[setting.setting_key] = this.parseValue(setting.setting_value, setting.setting_type);
    });

    return result;
  };

  // 私有方法：解析值
  SystemSetting.parseValue = function(value, type) {
    switch (type) {
      case 'number':
        return parseFloat(value) || 0;
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      default:
        return value;
    }
  };

  return SystemSetting;
};

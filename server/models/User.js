const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户ID'
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '用户名'
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码哈希'
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '邮箱',
      validate: {
        isEmail: true
      }
    },
    real_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '真实姓名'
    },
    role: {
      type: DataTypes.ENUM('admin', 'operator', 'viewer'),
      allowNull: false,
      defaultValue: 'operator',
      comment: '用户角色'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'locked'),
      allowNull: false,
      defaultValue: 'active',
      comment: '用户状态'
    },
    last_login_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间'
    },
    last_login_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: '最后登录IP'
    }
  }, {
    tableName: 'users',
    comment: '用户表',
    indexes: [
      {
        name: 'idx_role',
        fields: ['role']
      },
      {
        name: 'idx_status',
        fields: ['status']
      }
    ]
  });

  // 实例方法：验证密码
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  // 实例方法：更新最后登录信息
  User.prototype.updateLoginInfo = async function(ipAddress) {
    this.last_login_time = new Date();
    this.last_login_ip = ipAddress;
    return await this.save();
  };

  // 类方法：创建用户
  User.createUser = async function(userData) {
    const { password, ...otherData } = userData;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    return await this.create({
      ...otherData,
      password_hash: passwordHash
    });
  };

  // 类方法：更新用户
  User.updateUser = async function(id, userData) {
    const { password, ...otherData } = userData;
    
    if (password) {
      const saltRounds = 10;
      otherData.password_hash = await bcrypt.hash(password, saltRounds);
    }
    
    return await this.update(otherData, { where: { id } });
  };

  // 类方法：根据用户名查找用户
  User.findByUsername = async function(username) {
    return await this.findOne({ where: { username } });
  };

  // 类方法：检查用户权限
  User.hasPermission = function(userRole, requiredRole) {
    const roleHierarchy = {
      'admin': 3,
      'operator': 2,
      'viewer': 1
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  return User;
};

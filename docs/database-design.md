# 数据库设计文档

## 概述

本文档详细描述了58信息网广告管理系统的数据库设计，包括表结构、索引、关系和数据迁移策略。

## 数据库要求

- **数据库类型**: MySQL 8.0+ 或 MariaDB 10.5+
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **端口**: 3306 (默认)

## 表结构设计

### 1. 用户表 (users)

```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(100) NOT NULL COMMENT '用户名',
  `password_hash` varchar(255) NOT NULL COMMENT '密码哈希',
  `email` varchar(200) DEFAULT NULL COMMENT '邮箱',
  `real_name` varchar(100) DEFAULT NULL COMMENT '真实姓名',
  `role` enum('admin','operator','viewer') NOT NULL DEFAULT 'operator' COMMENT '用户角色',
  `status` enum('active','inactive','locked') NOT NULL DEFAULT 'active' COMMENT '用户状态',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(45) DEFAULT NULL COMMENT '最后登录IP',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

### 2. 广告信息表 (ads)

```sql
CREATE TABLE `ads` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '广告ID',
  `title` varchar(200) NOT NULL COMMENT '广告标题',
  `content` text NOT NULL COMMENT '广告内容',
  `link` varchar(500) NOT NULL COMMENT '跳转链接',
  `region` enum('yellow','white','lightYellow','cyan') NOT NULL COMMENT '所属区域',
  `start_date` datetime NOT NULL COMMENT '开始时间',
  `end_date` datetime NOT NULL COMMENT '结束时间',
  `experience` varchar(100) DEFAULT NULL COMMENT '游戏经验倍数',
  `version` varchar(100) DEFAULT NULL COMMENT '游戏版本',
  `sort_weight` int(11) NOT NULL DEFAULT 0 COMMENT '排序权重',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active' COMMENT '状态',
  `create_user` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_user` varchar(100) DEFAULT NULL COMMENT '更新人',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_region` (`region`),
  KEY `idx_status` (`status`),
  KEY `idx_start_date` (`start_date`),
  KEY `idx_end_date` (`end_date`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_region_status` (`region`, `status`),
  KEY `idx_date_range` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='广告信息表';
```

### 3. 续费记录表 (renewal_logs)

```sql
CREATE TABLE `renewal_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '续费记录ID',
  `ad_id` bigint(20) NOT NULL COMMENT '广告ID',
  `old_end_date` datetime NOT NULL COMMENT '续费前到期时间',
  `new_end_date` datetime NOT NULL COMMENT '续费后到期时间',
  `renewal_days` int(11) NOT NULL COMMENT '续费天数',
  `renewal_weeks` int(11) NOT NULL DEFAULT 0 COMMENT '续费周数',
  `renewal_months` int(11) NOT NULL DEFAULT 0 COMMENT '续费月数',
  `renewal_amount` decimal(10,2) DEFAULT NULL COMMENT '续费金额',
  `renewal_user` varchar(100) NOT NULL COMMENT '续费操作人',
  `renewal_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '续费时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_ad_id` (`ad_id`),
  KEY `idx_renewal_time` (`renewal_time`),
  KEY `idx_renewal_user` (`renewal_user`),
  CONSTRAINT `fk_renewal_ad` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='续费记录表';
```

### 4. 操作日志表 (operation_logs)

```sql
CREATE TABLE `operation_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_name` varchar(100) NOT NULL COMMENT '操作用户',
  `operation_type` varchar(50) NOT NULL COMMENT '操作类型',
  `operation_detail` text NOT NULL COMMENT '操作详情',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  `operation_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  `status` enum('success','failed') NOT NULL DEFAULT 'success' COMMENT '操作状态',
  `error_message` text DEFAULT NULL COMMENT '错误信息',
  PRIMARY KEY (`id`),
  KEY `idx_user_name` (`user_name`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_operation_time` (`operation_time`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_operation_user` FOREIGN KEY (`user_name`) REFERENCES `users` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';
```

### 5. 系统设置表 (system_settings)

```sql
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `setting_key` varchar(100) NOT NULL COMMENT '设置键',
  `setting_value` text NOT NULL COMMENT '设置值',
  `setting_type` enum('string','number','boolean','json') NOT NULL DEFAULT 'string' COMMENT '设置值类型',
  `description` varchar(500) DEFAULT NULL COMMENT '设置描述',
  `is_editable` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否可编辑',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统设置表';
```

## 数据关系图

```
users (1) ←→ (N) operation_logs
ads (1) ←→ (N) renewal_logs
```

## 索引策略

### 主键索引
- 所有表都有自增主键

### 外键索引
- 关联查询优化

### 复合索引
- 多字段查询优化

### 时间索引
- 时间范围查询优化

## 性能优化

### 查询优化
- 使用分页查询避免大量数据返回
- 合理使用WHERE条件过滤
- 避免SELECT *，只查询需要的字段
- 使用JOIN替代子查询

### 配置建议
```ini
# MySQL配置优化
[mysqld]
# 连接数
max_connections = 200

# 缓冲池大小（根据服务器内存调整）
innodb_buffer_pool_size = 1G

# 查询缓存
query_cache_size = 64M
query_cache_type = 1

# 慢查询日志
slow_query_log = 1
long_query_time = 2
```

## 数据迁移

### 从localStorage迁移

#### 1. 导出前端数据
在前端页面执行以下代码：

```javascript
// 导出localStorage数据
function exportLocalStorageData() {
    const adsData = JSON.parse(localStorage.getItem('adsDatabase') || '[]');
    const logsData = JSON.parse(localStorage.getItem('logsDatabase') || '[]');
    const settingsData = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    
    const exportData = {
        ads: adsData,
        logs: logsData,
        settings: settingsData,
        exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ads_data_export.json';
    a.click();
    URL.revokeObjectURL(url);
}

exportLocalStorageData();
```

#### 2. 迁移到数据库
```bash
# 迁移模拟数据
node scripts/migrate-localstorage.js migrate

# 从文件迁移数据
node scripts/migrate-localstorage.js migrate-file path/to/export.json

# 导出模拟数据
node scripts/migrate-localstorage.js export
```

## 备份与恢复

### 自动备份
```bash
# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p ads_system > backup_${DATE}.sql

# 添加到crontab（每天凌晨2点备份）
0 2 * * * /path/to/backup.sh
```

### 手动备份
```bash
# 备份整个数据库
mysqldump -u root -p ads_system > backup.sql

# 备份特定表
mysqldump -u root -p ads_system ads users > tables_backup.sql

# 恢复数据
mysql -u root -p ads_system < backup.sql
```

## 监控与维护

### 性能监控
```sql
-- 查看慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 查看连接数
SHOW STATUS LIKE 'Threads_connected';

-- 查看查询统计
SHOW STATUS LIKE 'Questions';
```

### 定期维护
```sql
-- 清理过期日志（保留90天）
DELETE FROM operation_logs 
WHERE operation_time < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 优化表
OPTIMIZE TABLE ads, operation_logs, renewal_logs;

-- 分析表
ANALYZE TABLE ads, operation_logs, renewal_logs;
```

## 扩展建议

### 读写分离
- 主库：写操作
- 从库：读操作
- 使用ProxySQL或MySQL Router

### 分库分表
- 按时间分表：operation_logs_2024_01
- 按区域分表：ads_yellow, ads_white
- 使用ShardingSphere或MyCat

### 缓存策略
- Redis缓存热点数据
- 本地缓存配置信息
- CDN缓存静态资源

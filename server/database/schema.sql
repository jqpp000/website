-- 58信息网广告管理系统数据库表结构
-- 创建数据库
CREATE DATABASE IF NOT EXISTS `ads_system` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `ads_system`;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
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

-- 广告信息表
CREATE TABLE IF NOT EXISTS `ads` (
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

-- 续费记录表
CREATE TABLE IF NOT EXISTS `renewal_logs` (
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

-- 操作日志表
CREATE TABLE IF NOT EXISTS `operation_logs` (
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

-- 系统设置表
CREATE TABLE IF NOT EXISTS `system_settings` (
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

-- 插入默认系统设置
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `is_editable`) VALUES
('expiry_warning_days', '7', 'number', '到期提醒阈值（天）', 1),
('page_size', '20', 'number', '每页显示数量', 1),
('auto_refresh_interval', '60', 'number', '自动刷新间隔（秒）', 1),
('max_ads_yellow', '20', 'number', '黄色置顶区最大广告数', 1),
('max_ads_white', '145', 'number', '套白区域最大广告数', 1),
('max_ads_light_yellow', '53', 'number', '套淡黄区域最大广告数', 1),
('max_ads_cyan', '67', 'number', '套青区域最大广告数', 1),
('system_name', '58信息网广告管理系统', 'string', '系统名称', 0),
('system_version', '1.0.0', 'string', '系统版本', 0),
('maintenance_mode', 'false', 'boolean', '维护模式', 1)
ON DUPLICATE KEY UPDATE `update_time` = CURRENT_TIMESTAMP;

-- 插入默认管理员用户（密码：admin123）
INSERT INTO `users` (`username`, `password_hash`, `real_name`, `role`, `status`, `email`) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', 'admin', 'active', 'admin@example.com')
ON DUPLICATE KEY UPDATE `update_time` = CURRENT_TIMESTAMP;

-- 插入测试操作员用户（密码：operator123）
INSERT INTO `users` (`username`, `password_hash`, `real_name`, `role`, `status`, `email`) VALUES
('operator', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '测试操作员', 'operator', 'active', 'operator@example.com')
ON DUPLICATE KEY UPDATE `update_time` = CURRENT_TIMESTAMP;

-- 创建视图：广告统计视图
CREATE OR REPLACE VIEW `v_ads_statistics` AS
SELECT 
  `region`,
  `status`,
  COUNT(*) as `count`,
  SUM(CASE WHEN `end_date` <= DATE_ADD(NOW(), INTERVAL 7 DAY) AND `end_date` > NOW() THEN 1 ELSE 0 END) as `expiring_soon`,
  SUM(CASE WHEN `end_date` <= NOW() THEN 1 ELSE 0 END) as `expired`
FROM `ads`
GROUP BY `region`, `status`;

-- 创建视图：用户操作统计视图
CREATE OR REPLACE VIEW `v_user_operations` AS
SELECT 
  `user_name`,
  `operation_type`,
  COUNT(*) as `operation_count`,
  SUM(CASE WHEN `status` = 'success' THEN 1 ELSE 0 END) as `success_count`,
  SUM(CASE WHEN `status` = 'failed' THEN 1 ELSE 0 END) as `failed_count`,
  MAX(`operation_time`) as `last_operation`
FROM `operation_logs`
GROUP BY `user_name`, `operation_type`;

-- 显示表结构
SHOW TABLES;
DESCRIBE `users`;
DESCRIBE `ads`;
DESCRIBE `renewal_logs`;
DESCRIBE `operation_logs`;
DESCRIBE `system_settings`;

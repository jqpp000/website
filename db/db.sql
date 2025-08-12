-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主机： 127.0.0.1
-- 生成日期： 2025-08-12 05:56:48
-- 服务器版本： 10.4.32-MariaDB
-- PHP 版本： 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 数据库： `db`
--

-- --------------------------------------------------------

--
-- 表的结构 `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 转存表中的数据 `admin`
--

INSERT INTO `admin` (`id`, `username`, `password`) VALUES
(1, 'admin', '$2b$10$QJ1sfn3QJZ3wH6QZJZJZJO0eQJZJZJZJZJZJZJZJZJZJZJZJZJ');

-- --------------------------------------------------------

--
-- 表的结构 `ads`
--

CREATE TABLE `ads` (
  `id` int(11) NOT NULL,
  `server_name` varchar(255) NOT NULL,
  `open_time` datetime NOT NULL,
  `feature` text DEFAULT NULL,
  `exp_rate` varchar(50) DEFAULT NULL,
  `version` varchar(50) DEFAULT NULL,
  `homepage` varchar(255) DEFAULT NULL,
  `display_duration` int(11) NOT NULL DEFAULT 24,
  `area` enum('top-yellow','white','orange','green') NOT NULL DEFAULT 'white',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expire_time` datetime GENERATED ALWAYS AS (`open_time` + interval `display_duration` hour) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 转存表中的数据 `ads`
--

INSERT INTO `ads` (`id`, `server_name`, `open_time`, `feature`, `exp_rate`, `version`, `homepage`, `display_duration`, `area`, `created_at`, `updated_at`) VALUES
(1, '发布01广告', '2025-08-13 08:51:00', '发布01广告发布01广告发布01广告发布01广告发布01广告', '5倍', '1.03H', 'https://poe2.caimogu.cc/', 24, 'top-yellow', '2025-08-12 03:32:00', '2025-08-12 03:32:00'),
(2, '发布02广告', '2025-08-12 04:32:00', '发布02广告发布02广告发布02广告发布02广告发布02广告', '50', '1.03H', 'https://poe2.caimogu.cc/', 24, 'white', '2025-08-12 03:33:11', '2025-08-12 03:33:11'),
(3, '发布03广告', '2025-08-12 04:33:00', '发布03广告发布03广告发布03广告发布03广告发布03广告', '', '', 'https://poe2.caimogu.cc/', 24, 'orange', '2025-08-12 03:33:28', '2025-08-12 03:33:28'),
(4, '发布04广告', '2025-08-12 04:33:00', '发布04广告发布04广告发布04广告发布04广告', '', '', '', 24, 'green', '2025-08-12 03:33:57', '2025-08-12 03:33:57'),
(5, '发布01广告', '2025-08-13 08:51:00', '发布01广告发布01广告发布01广告发布01广告发布01广告', '5倍', '1.03H', 'https://poe2.caimogu.cc/', 24, 'top-yellow', '2025-08-12 03:32:00', '2025-08-12 03:32:00'),
(6, '发布02广告', '2025-08-12 04:32:00', '发布02广告发布02广告发布02广告发布02广告发布02广告', '50', '1.03H', 'https://poe2.caimogu.cc/', 24, 'white', '2025-08-12 03:33:11', '2025-08-12 03:33:11'),
(7, '发布03广告', '2025-08-12 04:33:00', '发布03广告发布03广告发布03广告发布03广告发布03广告', '', '', 'https://poe2.caimogu.cc/', 24, 'orange', '2025-08-12 03:33:28', '2025-08-12 03:33:28'),
(8, '发布04广告', '2025-08-12 04:33:00', '发布04广告发布04广告发布04广告发布04广告', '', '', '', 24, 'green', '2025-08-12 03:33:57', '2025-08-12 03:33:57');

--
-- 转储表的索引
--

--
-- 表的索引 `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- 表的索引 `ads`
--
ALTER TABLE `ads`
  ADD PRIMARY KEY (`id`);

--
-- 在导出的表使用AUTO_INCREMENT
--

--
-- 使用表AUTO_INCREMENT `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- 使用表AUTO_INCREMENT `ads`
--
ALTER TABLE `ads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

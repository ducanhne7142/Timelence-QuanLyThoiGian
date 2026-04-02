-- Tạo bảng sharedschedules cho chức năng chia sẻ lịch
CREATE TABLE IF NOT EXISTS `sharedschedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int NOT NULL,
  `user_id` int NOT NULL,
  `share_token` varchar(64) NOT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_password_protected` tinyint(1) NOT NULL DEFAULT '0',
  `password_hash` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `share_token` (`share_token`),
  KEY `IX_SharedSchedules_ScheduleId` (`schedule_id`),
  KEY `IX_SharedSchedules_UserId` (`user_id`),
  KEY `IX_SharedSchedules_IsActive` (`is_active`),
  CONSTRAINT `sharedschedules_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sharedschedules_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: _prisma_migrations
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: chords
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `chords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(16) NOT NULL,
  `tuning_id` int(11) NOT NULL,
  `grip_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `chords_tuning_id_fkey` (`tuning_id`),
  KEY `chords_grip_id_fkey` (`grip_id`),
  CONSTRAINT `chords_grip_id_fkey` FOREIGN KEY (`grip_id`) REFERENCES `grips` (`id`),
  CONSTRAINT `chords_tuning_id_fkey` FOREIGN KEY (`tuning_id`) REFERENCES `tunings` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 19 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: grips
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `grips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `strings` varchar(8) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `grips_strings_key` (`strings`)
) ENGINE = InnoDB AUTO_INCREMENT = 19 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: tunings
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tunings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(8) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tunings_value_key` (`value`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: user_tokens
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `user_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `type` enum(
  'email_verification',
  'password_reset',
  'api_access'
  ) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expires_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_tokens_user_id_fkey` (`user_id`),
  CONSTRAINT `user_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 23 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: users
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(16) NOT NULL,
  `first_name` varchar(16) NOT NULL,
  `last_name` varchar(32) NOT NULL,
  `email_address` varchar(255) NOT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `password_hash` varchar(255) NOT NULL,
  `password_changed_at` datetime(3) NOT NULL,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `two_factor_method` enum(
  'email',
  'google_authenticator',
  'microsoft_authenticator'
  ) DEFAULT NULL,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `two_factor_backup` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`two_factor_backup`)),
  `role` enum('user', 'admin') NOT NULL DEFAULT 'user',
  `status` enum('active', 'pending', 'suspended') NOT NULL DEFAULT 'pending',
  `account_created_at` datetime(3) NOT NULL,
  `last_login_at` datetime(3) NOT NULL,
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`preferences`)),
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: _prisma_migrations
# ------------------------------------------------------------

INSERT INTO
  `_prisma_migrations` (
    `id`,
    `checksum`,
    `finished_at`,
    `migration_name`,
    `logs`,
    `rolled_back_at`,
    `started_at`,
    `applied_steps_count`
  )
VALUES
  (
    '65d5f5f9-ab56-4816-aa09-a721e22bb31b',
    'e16106e935f54e6428d6a257ec69bdbbedc1b0636b83104085a1d0bd42a8d2ba',
    '2025-11-19 05:49:01.989',
    '20251119054901_chord_radar',
    NULL,
    NULL,
    '2025-11-19 05:49:01.757',
    1
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: chords
# ------------------------------------------------------------

INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (3, 'F-5--\r', 1, 3);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (4, 'F-maj--\r', 1, 4);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (5, 'F-min--\r', 1, 5);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (6, 'G-maj--\r', 1, 6);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (7, 'G-maj--\r', 1, 7);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (8, 'C-maj--\r', 1, 8);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (9, 'C-5--\r', 1, 9);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (10, 'D-maj--\r', 1, 10);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (11, 'D-min--\r', 1, 11);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (12, 'D-sus2--\r', 1, 12);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (13, 'D-sus4--\r', 1, 13);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (14, 'D-maj--A\r', 1, 14);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (15, 'A-maj--\r', 1, 15);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (16, 'A-min--\r', 1, 16);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (17, 'D-5\r', 2, 17);
INSERT INTO
  `chords` (`id`, `name`, `tuning_id`, `grip_id`)
VALUES
  (18, 'E-5', 2, 18);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: grips
# ------------------------------------------------------------

INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (17, '000xxx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (1, '022100');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (2, '022xxx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (5, '1331xx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (4, '1332xx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (3, '133xxx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (18, '222xxx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (6, '322003');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (7, '322033');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (14, 'x00232');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (16, 'x02210');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (15, 'x02220');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (8, 'x32010');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (9, 'x355xx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (12, 'xx0230');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (11, 'xx0231');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (10, 'xx0232');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (13, 'xx0233');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: tunings
# ------------------------------------------------------------

INSERT INTO
  `tunings` (`id`, `value`)
VALUES
  (2, 'dadgbe');
INSERT INTO
  `tunings` (`id`, `value`)
VALUES
  (1, 'eadgbe');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: user_tokens
# ------------------------------------------------------------

INSERT INTO
  `user_tokens` (
    `id`,
    `user_id`,
    `token`,
    `type`,
    `created_at`,
    `expires_at`
  )
VALUES
  (
    21,
    3,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYzNTM2OTM3LCJleHAiOjE3NjM1NDA1Mzd9.y57yVIRQJ-37AP_naqHdqY3g9ZG72pyl_vSawxCjUjQ',
    'api_access',
    '2025-11-19 08:22:17.074',
    '2025-11-19 09:22:17.074'
  );
INSERT INTO
  `user_tokens` (
    `id`,
    `user_id`,
    `token`,
    `type`,
    `created_at`,
    `expires_at`
  )
VALUES
  (
    22,
    13,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MzUzNzAzNywiZXhwIjoxNzYzNTQwNjM3fQ.MESOwjHDrGCvsel-P0sYB8UjOlHp5tzuGQ9SG94JFtw',
    'api_access',
    '2025-11-19 08:23:57.470',
    '2025-11-19 09:23:57.470'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: users
# ------------------------------------------------------------

INSERT INTO
  `users` (
    `id`,
    `user_name`,
    `first_name`,
    `last_name`,
    `email_address`,
    `email_verified`,
    `password_hash`,
    `password_changed_at`,
    `two_factor_enabled`,
    `two_factor_method`,
    `two_factor_secret`,
    `two_factor_backup`,
    `role`,
    `status`,
    `account_created_at`,
    `last_login_at`,
    `preferences`
  )
VALUES
  (
    3,
    'testadmin',
    'Test',
    'Admin',
    'testadmin@example.com',
    1,
    '$2b$10$i2DCTS71f1Fcb26/yFrN8uFXCLoohHPrSMNCIviJ9L3dQcP/8RDCG',
    '2025-11-19 06:03:48.582',
    0,
    NULL,
    NULL,
    '[]',
    'admin',
    'active',
    '2025-11-19 06:03:48.582',
    '2025-11-19 08:22:17.074',
    '{\"theme\":\"dark\",\"notifications\":true}'
  );
INSERT INTO
  `users` (
    `id`,
    `user_name`,
    `first_name`,
    `last_name`,
    `email_address`,
    `email_verified`,
    `password_hash`,
    `password_changed_at`,
    `two_factor_enabled`,
    `two_factor_method`,
    `two_factor_secret`,
    `two_factor_backup`,
    `role`,
    `status`,
    `account_created_at`,
    `last_login_at`,
    `preferences`
  )
VALUES
  (
    13,
    'testuser',
    'Test',
    'User',
    'gal.akos.2005@gmail.com',
    1,
    '$2b$10$XXI6b7At1S6apiiXm7qxSeWv41cf0ZtG5SqYHE0m.GzIDTkKaJzGK',
    '2025-11-19 08:16:10.534',
    0,
    NULL,
    NULL,
    '[]',
    'admin',
    'active',
    '2025-11-19 08:16:10.534',
    '2025-11-19 08:23:57.470',
    '{\"theme\":\"dark\",\"notifications\":true}'
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

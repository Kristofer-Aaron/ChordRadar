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
  `tuning_id` int(11) NOT NULL,
  `grip_id` int(11) NOT NULL,
  `notation_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chords_notation_tuning_grip_uk` (`notation_id`, `tuning_id`, `grip_id`),
  KEY `chords_tuning_id_fkey` (`tuning_id`),
  KEY `chords_grip_id_fkey` (`grip_id`),
  CONSTRAINT `chords_grip_id_fkey` FOREIGN KEY (`grip_id`) REFERENCES `grips` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chords_notation_id_fkey` FOREIGN KEY (`notation_id`) REFERENCES `notations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chords_tuning_id_fkey` FOREIGN KEY (`tuning_id`) REFERENCES `tunings` (`id`) ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 20 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: grips
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `grips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `strings` varchar(8) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `grips_strings_key` (`strings`)
) ENGINE = InnoDB AUTO_INCREMENT = 20 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: notations
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `notations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `notations_value_key` (`value`)
) ENGINE = InnoDB AUTO_INCREMENT = 20 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
# SCHEMA DUMP FOR TABLE: user_chord_relations
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `user_chord_relations` (
  `user_id` int(11) NOT NULL,
  `chord_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`, `chord_id`),
  UNIQUE KEY `user_chord_relations_user_id_chord_id_key` (`user_id`, `chord_id`),
  KEY `user_chord_relations_chord_id_fkey` (`chord_id`),
  CONSTRAINT `user_chord_relations_chord_id_fkey` FOREIGN KEY (`chord_id`) REFERENCES `chords` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_chord_relations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
  CONSTRAINT `user_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 16 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
  `two_factor_method` enum('email', 'totp') DEFAULT NULL,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `two_factor_backup` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`two_factor_backup`)),
  `role` enum('user', 'admin') NOT NULL DEFAULT 'user',
  `status` enum('active', 'pending', 'suspended') NOT NULL DEFAULT 'pending',
  `account_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `last_login_at` datetime(3) NOT NULL,
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`preferences`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_address_key` (`email_address`)
) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
    '274068a3-3e73-4280-8450-fd7f2d1af3f9',
    '642c2d2c8c4a6a94c39c8ce31798cded32b2b4474b94716245cf4d3208bd954b',
    '2026-03-03 17:23:26.975',
    '20260218123434_add_chords_composite_unique',
    NULL,
    NULL,
    '2026-03-03 17:23:26.967',
    1
  );
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
    '4c7ffc1a-d0c7-4e4d-b697-cb893eb19f6d',
    'aad1cdb732fb97b7ad58227bbf9d1929042cd14a5af9fc4eb07765322206f145',
    '2026-03-03 17:23:26.982',
    '20260226080452_add_unique_user_chord_constraint',
    NULL,
    NULL,
    '2026-03-03 17:23:26.976',
    1
  );
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
    '5f6a9490-2fa2-44a4-b27c-8af192cca910',
    '123ba30c635c204c7f9fb2ce0a81ce62a1376dca6638551fa8818c72398f1409',
    '2026-03-03 17:23:26.710',
    '20251119151803_chord_radar',
    NULL,
    NULL,
    '2026-03-03 17:23:26.635',
    1
  );
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
    '62adb90f-0675-45ff-8c35-17b00fa71b8f',
    '88efd46db00e72d59c6590568700b44756718bab92252afa38ee5a812267933c',
    '2026-03-03 17:23:26.967',
    '20260212081846',
    NULL,
    NULL,
    '2026-03-03 17:23:26.790',
    1
  );
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
    '67955a9e-f21f-4fe8-bef8-118d7f3ef8a8',
    '22dbb9c83456c405ba6001263e76f99b15233be0dd8398ea11c52394cede82fa',
    '2026-03-03 17:23:26.717',
    '20251119153100',
    NULL,
    NULL,
    '2026-03-03 17:23:26.710',
    1
  );
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
    'b8fad380-fc40-42b8-85c0-7e989ce469a0',
    'a0021fba2d211b744c5eebda2cdc67f323130ede104f7c541576437e14003ad7',
    '2026-03-03 17:23:26.762',
    '20251119153814_chord_radar',
    NULL,
    NULL,
    '2026-03-03 17:23:26.718',
    1
  );
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
    'f11b76a7-afd8-4fec-97e8-1aee88cf373f',
    'ea07a5e95198aa7c4df919df54abaaf05f7adbc1bf50686b9c3b559f092180ad',
    '2026-03-03 17:23:26.634',
    '20251119054901_chord_radar',
    NULL,
    NULL,
    '2026-03-03 17:23:26.507',
    1
  );
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
    'feef81aa-cc29-4d78-937e-d10450ed5845',
    'f714d0f1ce90ee28a6d0a93e908881d5f82411e05a58bcd73f234482a9011a85',
    '2026-03-03 17:23:26.788',
    '20260205073619',
    NULL,
    NULL,
    '2026-03-03 17:23:26.763',
    1
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: chords
# ------------------------------------------------------------

INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (2, 1, 2, 2);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (3, 1, 3, 3);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (4, 1, 4, 4);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (5, 1, 5, 5);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (6, 1, 6, 6);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (7, 1, 7, 7);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (8, 1, 8, 7);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (9, 1, 9, 8);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (10, 1, 10, 9);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (11, 1, 11, 10);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (12, 1, 12, 11);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (13, 1, 13, 12);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (14, 1, 14, 13);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (15, 1, 15, 14);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (16, 1, 16, 15);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (17, 1, 17, 16);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (18, 2, 18, 17);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (19, 2, 19, 18);
INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (1, 1, 1, 19);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: grips
# ------------------------------------------------------------

INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (18, '000xxx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (1, '022000');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (2, '022100');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (3, '022xxx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (6, '1331xx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (5, '1332xx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (4, '133xxx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (19, '222xxx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (7, '322003');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (8, '322033');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (15, 'x00232');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (17, 'x02210');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (16, 'x02220');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (9, 'x32010');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (10, 'x355xx');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (13, 'xx0230');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (12, 'xx0231');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (11, 'xx0232');
INSERT INTO
  `grips` (`id`, `strings`)
VALUES
  (14, 'xx0233');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: notations
# ------------------------------------------------------------

INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (15, 'A-maj--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (16, 'A-min--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (19, 'asd');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (9, 'C-5--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (8, 'C-maj--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (17, 'D-5');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (10, 'D-maj--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (14, 'D-maj--A');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (11, 'D-min--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (12, 'D-sus2--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (13, 'D-sus4--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (18, 'E-5');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (3, 'E-5--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (2, 'E-maj--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (1, 'E-min--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (4, 'F-5--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (5, 'F-maj--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (6, 'F-min--');
INSERT INTO
  `notations` (`id`, `value`)
VALUES
  (7, 'G-maj--');

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
# DATA DUMP FOR TABLE: user_chord_relations
# ------------------------------------------------------------


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
    4,
    2,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzM3OTA3MzcsImV4cCI6MTc3Mzc5NDMzN30.R3MKbgm1FoxfafXCQIyxpoXDL67IqbWwa3sJhJKsHDw',
    'api_access',
    '2026-03-18 00:38:57.967',
    '2026-03-18 01:38:57.967'
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
    15,
    3,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6ImFkbWluIiwiaWF0IjoxNzc2MjkyMzQ5LCJleHAiOjE3NzYyOTU5NDl9.bpzuksFkfZAL1_D171rAfiXX1rPIFOcJMIwcq-mF7G4',
    'api_access',
    '2026-04-16 00:32:29.061',
    '2026-04-16 01:32:29.061'
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
    1,
    'testuser',
    'Test',
    'User',
    'testuser@example.com',
    1,
    '$2b$10$AIRSsSNxRicvNlkeXfG.auimTCaBhKpLrdMHiX1oej/T6kObDCup2',
    '2026-03-17 23:27:47.892',
    0,
    NULL,
    NULL,
    '[]',
    'user',
    'active',
    '2026-03-17 23:27:47.892',
    '2026-03-17 23:27:47.892',
    '{\"theme\":\"dark\"}'
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
    2,
    'testuser2',
    'Test',
    'User2',
    'testuser2@example.com',
    1,
    '$2b$10$tBHarvv1AoFq36hNWy/br.VmaUX9SBwkuIgnX/VTNNuQe75frVyvW',
    '2026-03-17 23:27:47.961',
    0,
    NULL,
    NULL,
    '[]',
    'user',
    'active',
    '2026-03-17 23:27:47.961',
    '2026-03-17 23:27:47.961',
    '{\"theme\":\"dark\"}'
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
    3,
    'testadmin',
    'Test',
    'Admin',
    'testadmin@example.com',
    1,
    '$2b$10$TLiWFEza.je35WUA7.OWUu7o1aAaGPLHlr7O4EVdBdpUBx32.mWyi',
    '2026-03-17 23:27:48.015',
    0,
    NULL,
    NULL,
    '[]',
    'admin',
    'active',
    '2026-03-17 23:27:48.015',
    '2026-03-17 23:27:48.015',
    '{\"theme\":\"dark\"}'
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

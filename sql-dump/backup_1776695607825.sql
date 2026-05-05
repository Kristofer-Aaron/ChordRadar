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
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: grips
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `grips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `strings` varchar(8) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `grips_strings_key` (`strings`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: notations
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `notations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `notations_value_key` (`value`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: tunings
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tunings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(8) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tunings_value_key` (`value`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
    '21e42811-ebb9-4617-a474-2cfdc5ebed48',
    'b8e69a1685c0c5617c2ce20f5f49e9cf398cf911210ed1fdf656fa4c1dbd16b0',
    '2026-04-20 14:33:12.549',
    '20260218123434_add_chords_composite_unique',
    NULL,
    NULL,
    '2026-04-20 14:33:12.541',
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
    '40e12134-0677-4da0-a4ae-74e1b3dedd87',
    '64180cca5b9a7689d0b94d6ca1a8c2de8579e4f8ed59b3580d88047d9d0ac7ec',
    '2026-04-20 14:33:12.555',
    '20260226080452_add_unique_user_chord_constraint',
    NULL,
    NULL,
    '2026-04-20 14:33:12.549',
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
    '47f60081-d53e-4a8c-8f83-14f44b0eee7b',
    '123ba30c635c204c7f9fb2ce0a81ce62a1376dca6638551fa8818c72398f1409',
    '2026-04-20 14:33:12.311',
    '20251119151803_chord_radar',
    NULL,
    NULL,
    '2026-04-20 14:33:12.252',
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
    '4cf21483-aeaa-4969-b519-1f7d5bbde760',
    'd010b41cb5ce5be53991c144048100ea5caa74a8a7f74647e9e8a5f82d4ed3c3',
    '2026-04-20 14:33:12.540',
    '20260212081846',
    NULL,
    NULL,
    '2026-04-20 14:33:12.393',
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
    '86abcffa-c2b5-4e08-a7a7-3ec8ae89b5e3',
    '22dbb9c83456c405ba6001263e76f99b15233be0dd8398ea11c52394cede82fa',
    '2026-04-20 14:33:12.319',
    '20251119153100',
    NULL,
    NULL,
    '2026-04-20 14:33:12.312',
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
    '8ca0fbca-afe5-4a91-a851-4fea905907d5',
    'c10ed341e0cb7c7f97b790501e02a2b3855ac6987a076ef2d8f4f79c89653563',
    '2026-04-20 14:33:12.392',
    '20260205073619',
    NULL,
    NULL,
    '2026-04-20 14:33:12.358',
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
    '8d0dd9e3-7632-4239-a68f-1b59302a42d9',
    'ea07a5e95198aa7c4df919df54abaaf05f7adbc1bf50686b9c3b559f092180ad',
    '2026-04-20 14:33:12.251',
    '20251119054901_chord_radar',
    NULL,
    NULL,
    '2026-04-20 14:33:12.154',
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
    'a7f533d3-c5f5-4f83-a019-1743eccec58e',
    'a0021fba2d211b744c5eebda2cdc67f323130ede104f7c541576437e14003ad7',
    '2026-04-20 14:33:12.357',
    '20251119153814_chord_radar',
    NULL,
    NULL,
    '2026-04-20 14:33:12.320',
    1
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: chords
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: grips
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: notations
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: tunings
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: user_chord_relations
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: user_tokens
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: users
# ------------------------------------------------------------


/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

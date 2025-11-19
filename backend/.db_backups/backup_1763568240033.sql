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
  KEY `chords_tuning_id_fkey` (`tuning_id`),
  KEY `chords_grip_id_fkey` (`grip_id`),
  KEY `chords_notation_id_fkey` (`notation_id`),
  CONSTRAINT `chords_grip_id_fkey` FOREIGN KEY (`grip_id`) REFERENCES `grips` (`id`),
  CONSTRAINT `chords_notation_id_fkey` FOREIGN KEY (`notation_id`) REFERENCES `notations` (`id`),
  CONSTRAINT `chords_tuning_id_fkey` FOREIGN KEY (`tuning_id`) REFERENCES `tunings` (`id`)
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
# SCHEMA DUMP FOR TABLE: user_chord_relations
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `user_chord_relations` (
  `user_id` int(11) NOT NULL,
  `chord_id` int(11) NOT NULL,
  PRIMARY KEY (`user_id`, `chord_id`),
  KEY `user_chord_relations_chord_id_fkey` (`chord_id`),
  CONSTRAINT `user_chord_relations_chord_id_fkey` FOREIGN KEY (`chord_id`) REFERENCES `chords` (`id`),
  CONSTRAINT `user_chord_relations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
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
  CONSTRAINT `user_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
  `account_created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `last_login_at` datetime(3) NOT NULL,
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`preferences`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_address_key` (`email_address`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
    '169ca10f-ded0-435d-874a-ec1cdb823a58',
    '0a53fa7368e2c8ec14a4b413c81add651e5ce57e24937377998bedf0bbe24dc0',
    '2025-11-19 15:38:08.457',
    '20251119151803_chord_radar',
    NULL,
    NULL,
    '2025-11-19 15:38:08.228',
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
    '8b863d0f-6ce9-4d7a-8565-7a7a5078f937',
    'bc6849e10a6e093d5f3100d9a8da381f334303ba07f40e5914ba8124e29f9573',
    '2025-11-19 15:38:08.492',
    '20251119153100',
    NULL,
    NULL,
    '2025-11-19 15:38:08.458',
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
    '9260ca4d-582d-442f-a305-82091319a860',
    'e16106e935f54e6428d6a257ec69bdbbedc1b0636b83104085a1d0bd42a8d2ba',
    '2025-11-19 15:38:08.226',
    '20251119054901_chord_radar',
    NULL,
    NULL,
    '2025-11-19 15:38:08.008',
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
    'f47172e1-ccfe-49a1-96a1-ac24cbb1d6d7',
    '018c635f50df76ad7d5b3a3faa45aabf75d5b0409711a415d455fe6d6a090719',
    '2025-11-19 15:38:15.405',
    '20251119153814_chord_radar',
    NULL,
    NULL,
    '2025-11-19 15:38:15.269',
    1
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: chords
# ------------------------------------------------------------

INSERT INTO
  `chords` (`id`, `tuning_id`, `grip_id`, `notation_id`)
VALUES
  (1, 1, 1, 1);
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
    1,
    1,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjM1Njc4ODgsImV4cCI6MTc2MzU3MTQ4OH0.hlpdI8_O2Zwc8hMry32FwQOEH2eGPnseNWyj1MI86nU',
    'api_access',
    '2025-11-19 16:58:08.753',
    '2025-11-19 17:58:08.753'
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
    '$2b$10$YSD3I1GvRCREhBY8e9Yts.7QPjbhAclXbk4c59o/FdC58KFyohD.G',
    '2025-11-19 15:56:21.787',
    0,
    NULL,
    NULL,
    '[]',
    'user',
    'active',
    '2025-11-19 15:56:21.787',
    '2025-11-19 16:58:08.753',
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
    2,
    'testadmin',
    'Test',
    'Admin',
    'testadmin@example.com',
    1,
    '$2b$10$.FZLRBNtxWcjOjl13MwCn.rcJWcw43fwjFtqYKSNs.JvR/lEAYj4S',
    '2025-11-19 15:56:21.811',
    0,
    NULL,
    NULL,
    '[]',
    'admin',
    'active',
    '2025-11-19 15:56:21.811',
    '2025-11-19 15:56:21.811',
    '{\"theme\":\"dark\",\"notifications\":true}'
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

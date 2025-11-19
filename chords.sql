-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2025. Sze 08. 13:11
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `chords`
--
CREATE DATABASE IF NOT EXISTS `chords` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;
USE `chords`;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `chord`
--

CREATE TABLE `chord` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `tuning_id` int(11) NOT NULL,
  `grip_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `grip`
--

CREATE TABLE `grip` (
  `id` int(11) NOT NULL,
  `strings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`strings`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `tuning`
--

CREATE TABLE `tuning` (
  `id` int(11) NOT NULL,
  `value` varchar(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `chord`
--
ALTER TABLE `chord`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tuning_id` (`tuning_id`),
  ADD KEY `grip_id` (`grip_id`);

--
-- A tábla indexei `grip`
--
ALTER TABLE `grip`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `tuning`
--
ALTER TABLE `tuning`
  ADD PRIMARY KEY (`id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `chord`
--
ALTER TABLE `chord`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `grip`
--
ALTER TABLE `grip`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `tuning`
--
ALTER TABLE `tuning`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `chord`
--
ALTER TABLE `chord`
  ADD CONSTRAINT `chord_ibfk_1` FOREIGN KEY (`tuning_id`) REFERENCES `tuning` (`id`),
  ADD CONSTRAINT `chord_ibfk_2` FOREIGN KEY (`grip_id`) REFERENCES `grip` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- phpMyAdmin SQL Dump
-- version 4.5.2
-- http://www.phpmyadmin.net
--
-- Client :  127.0.0.1
-- Généré le :  Ven 06 Novembre 2020 à 01:42
-- Version du serveur :  5.7.9
-- Version de PHP :  5.6.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  `fuegookadmin`
--

-- --------------------------------------------------------

--
-- Structure de la table `directives`
--

DROP TABLE IF EXISTS `directives`;
CREATE TABLE IF NOT EXISTS `directives` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `campagnes` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `type_de_fichier` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `sous_type` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `idZone` int(11) DEFAULT NULL,
  `idSousZone` int(11) DEFAULT NULL,
  `idAgence` int(11) DEFAULT NULL,
  `listeIdsVendeurs` varchar(300) COLLATE utf8_bin DEFAULT NULL,
  `deps` varchar(300) COLLATE utf8_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idZone` (`idZone`),
  KEY `idSousZone` (`idSousZone`),
  KEY `idAgence` (`idAgence`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `directives`
--
ALTER TABLE `directives`
  ADD CONSTRAINT `Directives_idAgence` FOREIGN KEY (`idAgence`) REFERENCES `agences` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Directives_idSousZone` FOREIGN KEY (`idSousZone`) REFERENCES `souszones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Directives_idZone` FOREIGN KEY (`idZone`) REFERENCES `zones` (`id`) ON DELETE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

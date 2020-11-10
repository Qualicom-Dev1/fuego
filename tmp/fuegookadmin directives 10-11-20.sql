-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le :  mar. 10 nov. 2020 à 16:17
-- Version du serveur :  8.0.18
-- Version de PHP :  5.6.40

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
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
-- Structure de la table `campagnes`
--

DROP TABLE IF EXISTS `campagnes`;
CREATE TABLE IF NOT EXISTS `campagnes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `sources_types` varchar(255) DEFAULT NULL,
  `deps` varchar(255) DEFAULT NULL,
  `statuts` varchar(255) DEFAULT NULL,
  `prix` int(11) DEFAULT NULL,
  `etat_campagne` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

--
-- Déchargement des données de la table `campagnes`
--

INSERT INTO `campagnes` (`id`, `nom`, `sources_types`, `deps`, `statuts`, `prix`, `etat_campagne`, `createdAt`, `updatedAt`) VALUES
(1, 'test', 'DOLEAD,PAC/ECOGREEN,', '15,40', '1,2', 0, 1, '2020-11-10 12:41:34', '2020-11-10 12:58:34');

-- --------------------------------------------------------

--
-- Structure de la table `directives`
--

DROP TABLE IF EXISTS `directives`;
CREATE TABLE IF NOT EXISTS `directives` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL,
  `idCampagne` int(11) DEFAULT NULL,
  `type_de_fichier` varchar(255) DEFAULT NULL,
  `sous_type` varchar(255) DEFAULT NULL,
  `idZone` int(11) DEFAULT NULL,
  `idSousZone` int(11) DEFAULT NULL,
  `idAgence` int(11) DEFAULT NULL,
  `listeIdsVendeurs` varchar(300) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `deps` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Directives_idAgence` (`idAgence`),
  KEY `Directives_idSousZone` (`idSousZone`),
  KEY `Directives_idZone` (`idZone`),
  KEY `idCampagne` (`idCampagne`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

--
-- Déchargement des données de la table `directives`
--

INSERT INTO `directives` (`id`, `idUser`, `idCampagne`, `type_de_fichier`, `sous_type`, `idZone`, `idSousZone`, `idAgence`, `listeIdsVendeurs`, `deps`, `createdAt`, `updatedAt`) VALUES
(1, 16, 1, NULL, NULL, NULL, NULL, NULL, NULL, '15,40', '2020-11-10 18:13:07', '2020-11-10 18:13:07');

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `directives`
--
ALTER TABLE `directives`
  ADD CONSTRAINT `Directives_idAgence` FOREIGN KEY (`idAgence`) REFERENCES `agences` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Directives_idCampagne` FOREIGN KEY (`idCampagne`) REFERENCES `campagnes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `Directives_idSousZone` FOREIGN KEY (`idSousZone`) REFERENCES `souszones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Directives_idZone` FOREIGN KEY (`idZone`) REFERENCES `zones` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

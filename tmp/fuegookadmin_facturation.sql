-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le :  jeu. 24 sep. 2020 à 09:59
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
-- Structure de la table `ClientsBusiness`
--

DROP TABLE IF EXISTS `ClientsBusiness`;
CREATE TABLE IF NOT EXISTS `ClientsBusiness` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(256) NOT NULL,
  `adresse` varchar(500) DEFAULT '',
  `adresseComplement1` varchar(500) DEFAULT '',
  `adresseComplement2` varchar(500) DEFAULT '',
  `cp` varchar(5) DEFAULT '',
  `ville` varchar(256) DEFAULT '',
  `email` varchar(320) DEFAULT '',
  `telephone` varchar(10) DEFAULT '',
  `numeroTVA` varchar(13) DEFAULT '',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `Devis`
--

DROP TABLE IF EXISTS `Devis`;
CREATE TABLE IF NOT EXISTS `Devis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `refDevis` varchar(100) NOT NULL,
  `idPrestation` int(11) NOT NULL,
  `isValidated` tinyint(1) NOT NULL DEFAULT '0',
  `tva` float NOT NULL DEFAULT '20',
  `remise` float NOT NULL DEFAULT '0',
  `prixHT` float NOT NULL DEFAULT '0',
  `prixTTC` float NOT NULL DEFAULT '0',
  `isCanceled` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Devis_idPrestation` (`idPrestation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `Factures`
--

DROP TABLE IF EXISTS `Factures`;
CREATE TABLE IF NOT EXISTS `Factures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `refFacture` varchar(100) NOT NULL,
  `idDevis` int(11) DEFAULT NULL,
  `idPrestation` int(11) NOT NULL,
  `dateEmission` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateEcheance` date NOT NULL,
  `type` enum('acompte','avoir','solde') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'solde',
  `tva` float NOT NULL DEFAULT '20',
  `remise` float NOT NULL DEFAULT '0',
  `idTypePaiement` int(11) NOT NULL,
  `datePaiement` date DEFAULT NULL,
  `prixHT` float NOT NULL DEFAULT '0',
  `prixTTC` float NOT NULL DEFAULT '0',
  `isCanceled` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Factures_idDevis` (`idDevis`),
  KEY `Factures_idPrestation` (`idPrestation`),
  KEY `Factures_idTypePaiement` (`idTypePaiement`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `Poles`
--

DROP TABLE IF EXISTS `Poles`;
CREATE TABLE IF NOT EXISTS `Poles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(256) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `Prestations`
--

DROP TABLE IF EXISTS `Prestations`;
CREATE TABLE IF NOT EXISTS `Prestations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idClient` int(11) NOT NULL,
  `idPole` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Prestations_idClient` (`idClient`),
  KEY `Prestations_idPole` (`idPole`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `ProduitsBusiness`
--

DROP TABLE IF EXISTS `ProduitsBusiness`;
CREATE TABLE IF NOT EXISTS `ProduitsBusiness` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(256) NOT NULL,
  `designation` varchar(256) DEFAULT NULL,
  `prixUnitaire` float NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `ProduitsBusiness_Prestations`
--

DROP TABLE IF EXISTS `ProduitsBusiness_Prestations`;
CREATE TABLE IF NOT EXISTS `ProduitsBusiness_Prestations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idPrestation` int(11) NOT NULL,
  `idProduit` int(11) NOT NULL,
  `designation` varchar(256) DEFAULT NULL,
  `quantite` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ProduitsBusiness_Prestations_idPrestation` (`idPrestation`),
  KEY `ProduitsBusiness_Prestations_idProduit` (`idProduit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `TypesPaiement`
--

DROP TABLE IF EXISTS `TypesPaiement`;
CREATE TABLE IF NOT EXISTS `TypesPaiement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(256) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `Devis`
--
ALTER TABLE `Devis`
  ADD CONSTRAINT `Devis_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `Prestations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Contraintes pour la table `Factures`
--
ALTER TABLE `Factures`
  ADD CONSTRAINT `Factures_idDevis` FOREIGN KEY (`idDevis`) REFERENCES `Devis` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `Factures_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `Prestations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `Factures_idTypePaiement` FOREIGN KEY (`idTypePaiement`) REFERENCES `TypesPaiement` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Contraintes pour la table `Prestations`
--
ALTER TABLE `Prestations`
  ADD CONSTRAINT `Prestations_idClient` FOREIGN KEY (`idClient`) REFERENCES `ClientsBusiness` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `Prestations_idPole` FOREIGN KEY (`idPole`) REFERENCES `Poles` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Contraintes pour la table `ProduitsBusiness_Prestations`
--
ALTER TABLE `ProduitsBusiness_Prestations`
  ADD CONSTRAINT `ProduitsBusiness_Prestations_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `Prestations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `ProduitsBusiness_Prestations_idProduit` FOREIGN KEY (`idProduit`) REFERENCES `ProduitsBusiness` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

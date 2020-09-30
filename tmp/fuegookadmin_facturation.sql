-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le :  mer. 30 sep. 2020 à 07:52
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
-- Structure de la table `clientsbusiness`
--

DROP TABLE IF EXISTS `clientsbusiness`;
CREATE TABLE IF NOT EXISTS `clientsbusiness` (
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
-- Structure de la table `devis`
--

DROP TABLE IF EXISTS `devis`;
CREATE TABLE IF NOT EXISTS `devis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `refDevis` varchar(100) NOT NULL,
  `idPrestation` int(11) NOT NULL,
  `isValidated` tinyint(1) NOT NULL DEFAULT '0',
  `tva` float NOT NULL DEFAULT '20',
  `remise` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prixHT` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prixTTC` decimal(10,2) NOT NULL DEFAULT '0.00',
  `isCanceled` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Devis_idPrestation` (`idPrestation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `factures`
--

DROP TABLE IF EXISTS `factures`;
CREATE TABLE IF NOT EXISTS `factures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `refFacture` varchar(100) NOT NULL,
  `idDevis` int(11) DEFAULT NULL,
  `idPrestation` int(11) NOT NULL,
  `dateEmission` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateEcheance` date NOT NULL,
  `type` enum('acompte','avoir','solde') NOT NULL DEFAULT 'solde',
  `valeurAcompte` decimal(10,2) NOT NULL DEFAULT '0.00',
  `isAcomptePourcentage` tinyint(1) NOT NULL DEFAULT '0',
  `tva` float NOT NULL DEFAULT '20',
  `remise` decimal(10,2) NOT NULL DEFAULT '0.00',
  `idTypePaiement` int(11) DEFAULT NULL,
  `datePaiement` date DEFAULT NULL,
  `prixHT` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prixTTC` decimal(10,2) NOT NULL DEFAULT '0.00',
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
-- Structure de la table `poles`
--

DROP TABLE IF EXISTS `poles`;
CREATE TABLE IF NOT EXISTS `poles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(256) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `prestations`
--

DROP TABLE IF EXISTS `prestations`;
CREATE TABLE IF NOT EXISTS `prestations` (
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
-- Structure de la table `produitsbusiness`
--

DROP TABLE IF EXISTS `produitsbusiness`;
CREATE TABLE IF NOT EXISTS `produitsbusiness` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(256) NOT NULL,
  `designation` varchar(256) DEFAULT NULL,
  `isGroupe` tinyint(1) NOT NULL DEFAULT '0',
  `listeIdsProduits` varchar(300) DEFAULT NULL,
  `prixUnitaire` decimal(10,2) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `produitsbusiness_prestations`
--

DROP TABLE IF EXISTS `produitsbusiness_prestations`;
CREATE TABLE IF NOT EXISTS `produitsbusiness_prestations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idPrestation` int(11) NOT NULL,
  `idProduit` int(11) NOT NULL,
  `designation` varchar(256) NOT NULL,
  `quantite` int(11) NOT NULL,
  `prixUnitaire` decimal(10,2) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ProduitsBusiness_Prestations_idPrestation` (`idPrestation`),
  KEY `ProduitsBusiness_Prestations_idProduit` (`idProduit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `typespaiement`
--

DROP TABLE IF EXISTS `typespaiement`;
CREATE TABLE IF NOT EXISTS `typespaiement` (
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
-- Contraintes pour la table `devis`
--
ALTER TABLE `devis`
  ADD CONSTRAINT `Devis_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `prestations` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `factures`
--
ALTER TABLE `factures`
  ADD CONSTRAINT `Factures_idDevis` FOREIGN KEY (`idDevis`) REFERENCES `devis` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `Factures_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `prestations` (`id`),
  ADD CONSTRAINT `Factures_idTypePaiement` FOREIGN KEY (`idTypePaiement`) REFERENCES `typespaiement` (`id`);

--
-- Contraintes pour la table `prestations`
--
ALTER TABLE `prestations`
  ADD CONSTRAINT `Prestations_idClient` FOREIGN KEY (`idClient`) REFERENCES `clientsbusiness` (`id`),
  ADD CONSTRAINT `Prestations_idPole` FOREIGN KEY (`idPole`) REFERENCES `poles` (`id`);

--
-- Contraintes pour la table `produitsbusiness_prestations`
--
ALTER TABLE `produitsbusiness_prestations`
  ADD CONSTRAINT `ProduitsBusiness_Prestations_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `prestations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ProduitsBusiness_Prestations_idProduit` FOREIGN KEY (`idProduit`) REFERENCES `produitsbusiness` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- phpMyAdmin SQL Dump
-- version 4.5.2
-- http://www.phpmyadmin.net
--
-- Client :  127.0.0.1
-- Généré le :  Lun 28 Septembre 2020 à 14:53
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

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
  `tva` float NOT NULL DEFAULT '20',
  `remise` decimal(10,2) NOT NULL DEFAULT '0.00',
  `idTypePaiement` int(11) NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

--
-- Contenu de la table `poles`
--

INSERT INTO `poles` (`id`, `nom`, `createdAt`, `updatedAt`) VALUES
(1, 'Communication', '2020-09-25 10:07:02', '2020-09-25 13:14:53');

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

--
-- Contenu de la table `produitsbusiness`
--

INSERT INTO `produitsbusiness` (`id`, `nom`, `designation`, `isGroupe`, `listeIdsProduits`, `prixUnitaire`, `createdAt`, `updatedAt`) VALUES
(1, 'PAC air/air', NULL, 0, NULL, '15000.00', '2020-09-25 15:57:45', '2020-09-25 16:20:06'),
(3, 'Tuyau O45', NULL, 0, NULL, '45.00', '2020-09-28 10:33:57', '2020-09-28 10:33:57'),
(4, 'Bouchon vanne thermostatique', NULL, 0, NULL, '120.00', '2020-09-28 11:29:03', '2020-09-28 11:29:03'),
(5, 'Pack pac air/air', 'Pack complet installation pour PAC air/air', 1, '4,1,3', '14990.90', '2020-09-28 10:40:37', '2020-09-28 10:45:02');

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

--
-- Contenu de la table `typespaiement`
--

INSERT INTO `typespaiement` (`id`, `nom`, `createdAt`, `updatedAt`) VALUES
(1, 'Carte bancaire', '2020-09-24 16:09:17', '2020-09-24 16:15:00');

--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `devis`
--
ALTER TABLE `devis`
  ADD CONSTRAINT `Devis_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `prestations` (`id`);

--
-- Contraintes pour la table `factures`
--
ALTER TABLE `factures`
  ADD CONSTRAINT `Factures_idDevis` FOREIGN KEY (`idDevis`) REFERENCES `devis` (`id`),
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
  ADD CONSTRAINT `ProduitsBusiness_Prestations_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `prestations` (`id`),
  ADD CONSTRAINT `ProduitsBusiness_Prestations_idProduit` FOREIGN KEY (`idProduit`) REFERENCES `produitsbusiness` (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

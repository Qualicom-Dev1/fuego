-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le :  jeu. 29 oct. 2020 à 11:28
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
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `compteurs`
--

DROP TABLE IF EXISTS `Compteurs`;
CREATE TABLE IF NOT EXISTS `Compteurs` (
  `nom` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `valeur` int(11) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`nom`),
  UNIQUE KEY `Nom_Compteur` (`nom`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Déchargement des données de la table `compteurs`
--

INSERT INTO `Compteurs` (`nom`, `valeur`, `createdAt`, `updatedAt`) VALUES
('COMPTEUR_DEVIS', 1, '2020-10-01 13:49:41', '2020-10-21 14:15:53'),
('COMPTEUR_FACTURES_AVOIRS', 1, '2020-10-01 11:59:21', '2020-10-21 15:17:45'),
('COMPTEUR_FACTURES_GENERALES', 1, '2020-10-01 11:59:21', '2020-10-21 15:33:06');

-- --------------------------------------------------------

--
-- Structure de la table `devis`
--

DROP TABLE IF EXISTS `Devis`;
CREATE TABLE IF NOT EXISTS `Devis` (
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
  UNIQUE KEY `refDevis` (`refDevis`),
  KEY `Devis_idPrestation` (`idPrestation`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `factures`
--

DROP TABLE IF EXISTS `Factures`;
CREATE TABLE IF NOT EXISTS `Factures` (
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
  `idFactureAnnulee` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refFacture` (`refFacture`),
  KEY `Factures_idDevis` (`idDevis`),
  KEY `Factures_idPrestation` (`idPrestation`),
  KEY `Factures_idTypePaiement` (`idTypePaiement`),
  KEY `Factures_idFactureAnnulee` (`idFactureAnnulee`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `poles`
--

DROP TABLE IF EXISTS `Poles`;
CREATE TABLE IF NOT EXISTS `Poles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(256) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

--
-- Déchargement des données de la table `poles`
--

INSERT INTO `Poles` (`id`, `nom`, `createdAt`, `updatedAt`) VALUES
(1, 'COMMUNICATION', '2020-09-25 10:07:02', '2020-10-07 14:04:50'),
(2, 'MARKETING DIRECT', '2020-09-29 09:07:50', '2020-09-29 09:07:50');

-- --------------------------------------------------------

--
-- Structure de la table `prestations`
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
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `produitsbusiness`
--

DROP TABLE IF EXISTS `ProduitsBusiness`;
CREATE TABLE IF NOT EXISTS `ProduitsBusiness` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(256) NOT NULL,
  `designation` varchar(256) DEFAULT NULL,
  `isGroupe` tinyint(1) NOT NULL DEFAULT '0',
  `listeIdsProduits` varchar(300) DEFAULT NULL,
  `prixUnitaire` decimal(10,2) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

--
-- Déchargement des données de la table `produitsbusiness`
--

INSERT INTO `ProduitsBusiness` (`id`, `nom`, `designation`, `isGroupe`, `listeIdsProduits`, `prixUnitaire`, `createdAt`, `updatedAt`) VALUES
(1, 'Prise de RDV', 'Prise de RDV qualifiés', 0, NULL, '85.00', '2020-10-05 10:26:20', '2020-10-05 10:26:20'),
(2, 'Prise de RDV + vente', 'Prise de RDV qualifiés avec vente', 0, NULL, '170.00', '2020-10-05 10:30:24', '2020-10-05 10:30:24'),
(3, 'SMS de confirmation', 'SMS de confirmation 140 caractères - Envoi le jour du RDV', 0, NULL, '0.50', '2020-10-05 10:30:24', '2020-10-05 10:30:24'),
(4, 'Vente sur RDV', 'Complément de vente sur RDV reporté', 0, NULL, '85.00', '2020-10-05 14:38:58', '2020-10-05 14:38:58');

-- --------------------------------------------------------

--
-- Structure de la table `produitsbusiness_prestations`
--

DROP TABLE IF EXISTS `ProduitsBusiness_Prestations`;
CREATE TABLE IF NOT EXISTS `ProduitsBusiness_Prestations` (
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
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `rdvs`
--

ALTER TABLE `RDVs` ADD
  facturation date DEFAULT NULL,
  flagFacturationChange tinyint(1) NOT NULL DEFAULT '0';

-- --------------------------------------------------------

--
-- Structure de la table `rdvsfacturation_prestation`
--

DROP TABLE IF EXISTS `RDVsFacturation_Prestation`;
CREATE TABLE IF NOT EXISTS `RDVsFacturation_Prestation` (
  `idPrestation` int(11) NOT NULL,
  `listeIdsRDVs` varchar(10000) NOT NULL,
  `dateDebut` date NOT NULL,
  `dateFin` date NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPrestation`),
  UNIQUE KEY `idPrestation` (`idPrestation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `typespaiement`
--

DROP TABLE IF EXISTS `TypesPaiement`;
CREATE TABLE IF NOT EXISTS `TypesPaiement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(256) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `devis`
--
ALTER TABLE `Devis`
  ADD CONSTRAINT `Devis_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `Prestations` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `factures`
--
ALTER TABLE `Factures`
  ADD CONSTRAINT `Factures_idDevis` FOREIGN KEY (`idDevis`) REFERENCES `Devis` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `Factures_idFactureAnnulee` FOREIGN KEY (`idFactureAnnulee`) REFERENCES `Factures` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `Factures_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `Prestations` (`id`),
  ADD CONSTRAINT `Factures_idTypePaiement` FOREIGN KEY (`idTypePaiement`) REFERENCES `TypesPaiement` (`id`);

--
-- Contraintes pour la table `prestations`
--
ALTER TABLE `Prestations`
  ADD CONSTRAINT `Prestations_idClient` FOREIGN KEY (`idClient`) REFERENCES `ClientsBusiness` (`id`),
  ADD CONSTRAINT `Prestations_idPole` FOREIGN KEY (`idPole`) REFERENCES `Poles` (`id`);

--
-- Contraintes pour la table `produitsbusiness_prestations`
--
ALTER TABLE `ProduitsBusiness_Prestations`
  ADD CONSTRAINT `ProduitsBusiness_Prestations_idPrestation` FOREIGN KEY (`idPrestation`) REFERENCES `Prestations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ProduitsBusiness_Prestations_idProduit` FOREIGN KEY (`idProduit`) REFERENCES `Produitsbusiness` (`id`);

--
-- Contraintes pour la table `rdvsfacturation_prestation`
--
ALTER TABLE `RDVsFacturation_Prestation`
  ADD CONSTRAINT `RDVsFacturation_Prestation` FOREIGN KEY (`idPrestation`) REFERENCES `Prestations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

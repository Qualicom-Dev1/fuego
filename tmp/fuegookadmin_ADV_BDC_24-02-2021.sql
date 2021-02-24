-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le :  mar. 09 fév. 2021 à 14:47
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
-- Structure de la table `ADV_BDCs`
--

CREATE TABLE IF NOT EXISTS `ADV_BDCs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ref` varchar(256) NOT NULL,
  `idADV_BDC_client` int(11) NOT NULL,
  `idVendeur` int(11) NOT NULL,
  `listeIdsProduits` varchar(1000) NOT NULL,
  `prixHT` decimal(10,2) NOT NULL,
  `prixTTC` decimal(10,2) NOT NULL,
  `montantTVA` decimal(10,2) NOT NULL,
  `datePose` date NOT NULL,
  `dateLimitePose` date NOT NULL,
  `observations` varchar(1000) NOT NULL DEFAULT '',
  `idADV_BDC_infoPaiement` int(11) NOT NULL,
  `lienDocuments` varchar(500) DEFAULT NULL,
  `isValidated` tinyint(1) NOT NULL DEFAULT '0',
  `isCanceled` tinyint(1) NOT NULL DEFAULT '0',
  `idStructure` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ADV_BDCs_idADV_BDC_client` (`idADV_BDC_client`),
  KEY `ADV_BDCs_idVendeur` (`idVendeur`),
  KEY `ADV_BDCs_idStructure` (`idStructure`),
  KEY `ADV_BDCs_idADV_BDC_infoPaiement` (`idADV_BDC_infoPaiement`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `ADV_BDC_clients`
--

CREATE TABLE IF NOT EXISTS `ADV_BDC_clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `refIdClient` int(11) NOT NULL,
  `intitule` enum('M','MME','M et MME','Messieurs','Mesdames') NOT NULL,
  `nom1` varchar(256) NOT NULL,
  `nom2` varchar(256) DEFAULT NULL,
  `adresse` varchar(500) NOT NULL DEFAULT '',
  `adresseComplement1` varchar(500) NOT NULL DEFAULT '',
  `adresseComplement2` varchar(500) NOT NULL DEFAULT '',
  `cp` varchar(5) NOT NULL,
  `ville` varchar(256) NOT NULL,
  `email` varchar(320) NOT NULL,
  `telephonePort` varchar(10) NOT NULL,
  `telephoneFixe` varchar(10) DEFAULT NULL,
  `idClientFicheRenseignementsTechniques` int(11) NOT NULL,
  `clefSignature` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ADV_BDC_clients_refIdClient` (`refIdClient`),
  KEY `ADV_BDC_clients_idClientFicheRenseignementsTechniques` (`idClientFicheRenseignementsTechniques`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `ADV_BDC_clients_ficheRenseignementsTechniques`
--

CREATE TABLE IF NOT EXISTS `ADV_BDC_clients_ficheRenseignementsTechniques` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `typeInstallationElectrique` enum('monophasée','triphasée') NOT NULL,
  `puissanceKW` decimal(10,2) DEFAULT NULL,
  `puissanceA` decimal(10,2) DEFAULT NULL,
  `anneeConstructionMaison` int(4) DEFAULT NULL,
  `dureeSupposeeConstructionMaison` int(3) DEFAULT NULL,
  `dureeAcquisitionMaison` int(3) DEFAULT NULL,
  `typeResidence` enum('principale','secondaire') NOT NULL,
  `superficie` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `ADV_BDC_infoPaiements`
--

CREATE TABLE IF NOT EXISTS `ADV_BDC_infoPaiements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idADV_BDC_client` int(11) NOT NULL,
  `isAcompte` tinyint(1) NOT NULL,
  `typeAcompte` enum('CHÈQUE','ESPÈCES') DEFAULT NULL,
  `montantAcompte` decimal(10,2) NOT NULL DEFAULT '0.00',
  `isComptant` tinyint(1) NOT NULL DEFAULT '0',
  `montantComptant` decimal(10,2) NOT NULL DEFAULT '0.00',
  `isCredit` tinyint(1) NOT NULL DEFAULT '0',
  `montantCredit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `nbMensualiteCredit` int(11) NOT NULL DEFAULT '0',
  `montantMensualiteCredit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `nbMoisReportCredit` int(11) NOT NULL DEFAULT '0',
  `tauxNominalCredit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tauxEffectifGlobalCredit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `datePremiereEcheanceCredit` date DEFAULT NULL,
  `coutTotalCredit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ADV_BDC_infoPaiements_idADV_BDC_client` (`idADV_BDC_client`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `ADV_BDC_produits`
--

CREATE TABLE IF NOT EXISTS `ADV_BDC_produits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idADV_produit` int(11) NOT NULL,
  `ref` varchar(256) DEFAULT NULL,
  `designation` varchar(500) NOT NULL DEFAULT '',
  `description` varchar(1000) NOT NULL DEFAULT '',
  `caracteristique` decimal(10,2) DEFAULT NULL,
  `uniteCaracteristique` varchar(5) DEFAULT NULL,
  `isGroupe` tinyint(1) NOT NULL DEFAULT '0',
  `listeIdsProduits` varchar(1000) DEFAULT NULL,
  `prixUnitaireHT` decimal(10,2) NOT NULL,
  `prixUnitaireTTC` decimal(10,2) NOT NULL,
  `tauxTVA` decimal(4,2) NOT NULL,
  `montantTVA` decimal(10,2) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ADV_BDC_produits_idADV_produit` (`idADV_produit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `ADV_categories`
--

CREATE TABLE IF NOT EXISTS `ADV_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(256) NOT NULL,
  `description` varchar(1000) NOT NULL DEFAULT '',
  `idStructure` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ADV_categories_idStructure` (`idStructure`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `ADV_produits`
--

CREATE TABLE IF NOT EXISTS `ADV_produits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ref` varchar(256) DEFAULT NULL,
  `nom` varchar(256) NOT NULL,
  `designation` varchar(500) NOT NULL DEFAULT '',
  `description` varchar(1000) NOT NULL DEFAULT '',
  `caracteristique` decimal(10,2) DEFAULT NULL,
  `uniteCaracteristique` varchar(5) DEFAULT NULL,
  `isGroupe` tinyint(1) NOT NULL DEFAULT '0',
  `prixUnitaireHT` decimal(10,2) NOT NULL,
  `prixUnitaireTTC` decimal(10,2) NOT NULL,
  `tauxTVA` decimal(4,2) DEFAULT NULL,
  `montantTVA` decimal(10,2) NOT NULL,
  `idStructure` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ADV_produits_idStructure` (`idStructure`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `ADV_produitsListeProduits`
--

CREATE TABLE IF NOT EXISTS `ADV_produitsListeProduits` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `idGroupeProduit` int(11) NOT NULL,
    `idProduitListe` int(11) NOT NULL,
    `isGroupe` tinyint(1) NOT NULL DEFAULT '0',
    `quantite` int(11) NOT NULL DEFAULT '1',    
    `prixHT` decimal(10,2) NOT NULL,
    `prixTTC` decimal(10,2) NOT NULL,
    `tauxTVA` decimal(4,2) DEFAULT NULL,
    `montantTVA` decimal(10,2) NOT NULL,
    `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `ADV_produitsListeProduits_idGroupeProduit` (`idGroupeProduit`),
    KEY `ADV_produitsListeProduits_idProduitListe` (`idProduitListe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- --------------------------------------------------------

--
-- Structure de la table `ADV_produitsCategories`
--

CREATE TABLE IF NOT EXISTS `ADV_produitsCategories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idCategorie` int(11) NOT NULL,
  `idProduit` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ADV_produitsCategories_idCategorie` (`idCategorie`),
  KEY `ADV_produitsCategories_idProduit` (`idProduit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `ADV_BDCs`
--
ALTER TABLE `ADV_BDCs`
  ADD CONSTRAINT `ADV_BDCs_idADV_BDC_client` FOREIGN KEY (`idADV_BDC_client`) REFERENCES `ADV_BDC_clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ADV_BDCs_idADV_BDC_infoPaiement` FOREIGN KEY (`idADV_BDC_infoPaiement`) REFERENCES `ADV_BDC_infoPaiements` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `ADV_BDCs_idStructure` FOREIGN KEY (`idStructure`) REFERENCES `Structures` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ADV_BDCs_idVendeur` FOREIGN KEY (`idVendeur`) REFERENCES `Users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Contraintes pour la table `ADV_BDC_clients`
--
ALTER TABLE `ADV_BDC_clients`
  ADD CONSTRAINT `ADV_BDC_clients_idClientFicheRenseignementsTechniques` FOREIGN KEY (`idClientFicheRenseignementsTechniques`) REFERENCES `ADV_BDC_clients_ficheRenseignementsTechniques` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `ADV_BDC_clients_refIdClient` FOREIGN KEY (`refIdClient`) REFERENCES `Clients` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Contraintes pour la table `ADV_BDC_infoPaiements`
--
ALTER TABLE `ADV_BDC_infoPaiements`
  ADD CONSTRAINT `ADV_BDC_infoPaiements_idADV_BDC_client` FOREIGN KEY (`idADV_BDC_client`) REFERENCES `ADV_BDC_clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ADV_BDC_produits`
--
ALTER TABLE `ADV_BDC_produits`
  ADD CONSTRAINT `ADV_BDC_produits_idADV_produit` FOREIGN KEY (`idADV_produit`) REFERENCES `ADV_produits` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Contraintes pour la table `ADV_categories`
--
ALTER TABLE `ADV_categories`
  ADD CONSTRAINT `ADV_categories_idStructure` FOREIGN KEY (`idStructure`) REFERENCES `Structures` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ADV_produits`
--
ALTER TABLE `ADV_produits`
  ADD CONSTRAINT `ADV_produits_idStructure` FOREIGN KEY (`idStructure`) REFERENCES `Structures` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `adv_produitslisteproduits`
--
ALTER TABLE `ADV_produitsListeProduits`
  ADD CONSTRAINT `ADV_produitsListeProduits_idGroupeProduit` FOREIGN KEY (`idGroupeProduit`) REFERENCES `ADV_produits` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ADV_produitsListeProduits_idProduitListe` FOREIGN KEY (`idProduitListe`) REFERENCES `ADV_produits` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ADV_produitsCategories`
--
ALTER TABLE `ADV_produitsCategories`
  ADD CONSTRAINT `ADV_produitsCategories_idCategorie` FOREIGN KEY (`idCategorie`) REFERENCES `ADV_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ADV_produitsCategories_idProduit` FOREIGN KEY (`idProduit`) REFERENCES `ADV_produits` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

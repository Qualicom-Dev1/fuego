'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Clients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nom: {
        type: Sequelize.STRING
      },
      prenom: { type: Sequelize.STRING},
      tel1: { type: Sequelize.STRING},
      tel2: { type: Sequelize.STRING},
      tel3: { type: Sequelize.STRING},
      adresse: { type: Sequelize.STRING},
      cp: { type: Sequelize.INTEGER},
      dep: { type: Sequelize.INTEGER},
      ville: { type: Sequelize.STRING},
      relation: { type: Sequelize.STRING},
      nbadultes: { type: Sequelize.INTEGER},
      nbenfants: { type: Sequelize.INTEGER},
      civil1: { type: Sequelize.STRING},
      pro1: { type: Sequelize.STRING},
      pdetail1: { type: Sequelize.STRING},
      heuretravail1: { type: Sequelize.STRING},
      age1: { type: Sequelize.INTEGER},
      civil2: { type: Sequelize.STRING},
      pro2: { type: Sequelize.STRING},
      pdetail2: { type: Sequelize.STRING},
      heuretravail2: { type: Sequelize.STRING},
      age2: { type: Sequelize.INTEGER},
      anneepropr: { type: Sequelize.INTEGER},
      anneeconstr: { type: Sequelize.INTEGER},
      etages: { type: Sequelize.INTEGER},
      ci: { type: Sequelize.BOOLEAN},
      dv: { type: Sequelize.BOOLEAN},
      orientation: { type: Sequelize.STRING},
      velux: { type: Sequelize.INTEGER},
      chiens: { type: Sequelize.INTEGER},
      fioul: { type: Sequelize.BOOLEAN},
      agefioul: { type: Sequelize.INTEGER},
      prixfioul: { type: Sequelize.INTEGER},
      gaz: { type: Sequelize.BOOLEAN},
      precgaz: { type: Sequelize.STRING},
      agegaz: { type: Sequelize.INTEGER},
      prixgaz: { type: Sequelize.INTEGER},
      elec: { type: Sequelize.BOOLEAN},
      precelec: { type: Sequelize.STRING},
      ageelec: { type: Sequelize.INTEGER},
      prixelec: { type: Sequelize.INTEGER},
      cheminee: { type: Sequelize.BOOLEAN},
      precchem: { type: Sequelize.STRING},
      agechem: { type: Sequelize.INTEGER},
      prixchem: { type: Sequelize.INTEGER},
      poele: { type: Sequelize.BOOLEAN},
      precpoele: { type: Sequelize.STRING},
      agepoele: { type: Sequelize.INTEGER},
      prixpoele: { type: Sequelize.INTEGER},
      pacAA: { type: Sequelize.BOOLEAN},
      agepacAA: { type: Sequelize.INTEGER},
      prixpacAA: { type: Sequelize.INTEGER},
      pacAE: { type: Sequelize.BOOLEAN},
      agepacAE: { type: Sequelize.INTEGER},
      prixpacAE: { type: Sequelize.INTEGER},
      autre: { type: Sequelize.BOOLEAN},
      ageautre: { type: Sequelize.INTEGER},
      prixautre: { type: Sequelize.INTEGER},
      surface: {
        type: Sequelize.FLOAT
      },
      panneaux: {
        type: Sequelize.BOOLEAN
      },
      annee: {
        type: Sequelize.INTEGER
      },
      be: {
        type: Sequelize.BOOLEAN
      },
      commentaire: {
        type: Sequelize.TEXT
      },
      source: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      currentUser: {
        type: Sequelize.INTEGER
      },
      currentAction: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Clients');
  }
};
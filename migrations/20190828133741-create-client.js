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
      prenom: {
        type: Sequelize.STRING
      },
      tel1: {
        type: Sequelize.STRING
      },
      tel2: {
        type: Sequelize.STRING
      },
      tel3: {
        type: Sequelize.STRING
      },
      adresse: {
        type: Sequelize.STRING
      },
      cp: {
        type: Sequelize.INTEGER
      },
      ville: {
        type: Sequelize.STRING
      },
      relation: {
        type: Sequelize.STRING
      },
      pro1: {
        type: Sequelize.STRING
      },
      pdetail1: {
        type: Sequelize.STRING
      },
      age1: {
        type: Sequelize.INTEGER
      },
      pro2: {
        type: Sequelize.STRING
      },
      pdetail2: {
        type: Sequelize.STRING
      },
      age2: {
        type: Sequelize.INTEGER
      },
      fioul: {
        type: Sequelize.BOOLEAN
      },
      gaz: {
        type: Sequelize.BOOLEAN
      },
      elec: {
        type: Sequelize.BOOLEAN
      },
      bois: {
        type: Sequelize.BOOLEAN
      },
      pac: {
        type: Sequelize.BOOLEAN
      },
      autre: {
        type: Sequelize.BOOLEAN
      },
      fchauffage: {
        type: Sequelize.FLOAT
      },
      felec: {
        type: Sequelize.FLOAT
      },
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
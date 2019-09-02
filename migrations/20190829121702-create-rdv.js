'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('RDVs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      idClient: {
        type: Sequelize.INTEGER
      },
      idHisto: {
        type: Sequelize.INTEGER
      },
      idVendeur: {
        type: Sequelize.INTEGER
      },
      idCampagne: {
        type: Sequelize.INTEGER
      },
      idEtat: {
        type: Sequelize.STRING
      },
      commentaire: {
        type: Sequelize.TEXT
      },
      date: {
        type: Sequelize.DATE
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
    return queryInterface.dropTable('RDVs');
  }
};
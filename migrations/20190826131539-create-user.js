'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      login: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      nom: {
        type: Sequelize.STRING
      },
      prenom: {
        type: Sequelize.STRING
      },
      mail: {
        type: Sequelize.STRING
      },
      adresse: {
        type: Sequelize.STRING
      },
      dep: {
        type: Sequelize.INTEGER
      },
      birthday: {
        type: Sequelize.DATE
      },
      tel1: {
        type: Sequelize.STRING
      },
      tel2: {
        type: Sequelize.STRING
      },
      telcall: {
        type: Sequelize.STRING
      },
      billing: {
        type: Sequelize.STRING
      },
      objectif: {
        type: Sequelize.INTEGER
      },
      idRole: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    return queryInterface.dropTable('Users');
  }
};
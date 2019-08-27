'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Structures', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      idType: {
        type: Sequelize.INTEGER,
        allowNull: false,
        foreignKey: true,
      },
      nom: {
        type: Sequelize.STRING
      },
      adresse: {
        type: Sequelize.STRING
      },
      mail: {
        type: Sequelize.STRING
      },
      tel: {
        type: Sequelize.STRING
      },
      fax: {
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
    return queryInterface.dropTable('Structures');
  }
};
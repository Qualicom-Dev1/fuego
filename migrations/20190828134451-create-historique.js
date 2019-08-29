'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Historiques', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      idAction: {
        type: Sequelize.NUMBER
      },
      dateevent: {
        type: Sequelize.DATE
      },
      commentaire: {
        type: Sequelize.TEXT
      },
      idUser: {
        type: Sequelize.NUMBER
      },
      idRdv: {
        type: Sequelize.NUMBER
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
    return queryInterface.dropTable('Historiques');
  }
};
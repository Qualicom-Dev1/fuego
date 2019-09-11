'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Directives', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      deps: {
        type: Sequelize.STRING
      },
      idUser: {
        type: Sequelize.NUMBER
      },
      idCampagne: {
        type: Sequelize.NUMBER
      },
      type_de_fichier: {
        type: Sequelize.STRING
      },
      sous_type: {
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
    return queryInterface.dropTable('Directives');
  }
};
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Action = sequelize.define('Action', {
    nom: DataTypes.STRING
  }, {});
  Action.associate = function(models) {
    // associations can be defined here
  };
  return Action;
};
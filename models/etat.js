'use strict';
module.exports = (sequelize, DataTypes) => {
  const Etat = sequelize.define('Etat', {
    nom: DataTypes.STRING
  }, {});
  Etat.associate = function(models) {
    // associations can be defined here
  };
  return Etat;
};
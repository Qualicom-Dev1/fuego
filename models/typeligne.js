'use strict';
module.exports = (sequelize, DataTypes) => {
  const TypeLigne = sequelize.define('TypeLigne', {
    nom: DataTypes.STRING
  }, {});
  TypeLigne.associate = function(models) {
    // associations can be defined here
  };
  return TypeLigne;
};
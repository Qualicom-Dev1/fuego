'use strict';
module.exports = (sequelize, DataTypes) => {
  const Type = sequelize.define('Type', {
    nom: DataTypes.STRING
  }, {});
  Type.associate = function(models) {
    Type.hasMany(models.Structure, {foreignKey: 'idType'})
  };
  return Type;
};
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Structuresdependence = sequelize.define('Structuresdependence', {
    idStructure: DataTypes.NUMBER,
    idUser: DataTypes.NUMBER
  }, {});
  Structuresdependence.associate = function(models) {
    Structuresdependence.belongsTo(models.Structure, {foreignKey: 'idStructure'})
    Structuresdependence.belongsTo(models.User, {foreignKey: 'idUser'})
  };
  return Structuresdependence;
};
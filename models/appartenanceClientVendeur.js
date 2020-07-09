'use strict';
module.exports = (sequelize, DataTypes) => {
  const AppartenanceClientsVendeur = sequelize.define('AppartenanceClientsVendeur', {
    idVendeur: DataTypes.NUMBER,
    idClient: DataTypes.NUMBER,
    idParrain: DataTypes.NUMBER,
  }, {});
  AppartenanceClientsVendeur.associate = function(models) {
    AppartenanceClientsVendeur.belongsTo(models.User, {foreignKey: 'idVendeur'})
    AppartenanceClientsVendeur.belongsTo(models.Client, {foreignKey: 'idClient'})
  };
  return AppartenanceClientsVendeur;
};
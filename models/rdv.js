'use strict';
module.exports = (sequelize, DataTypes) => {
  const RDV = sequelize.define('RDV', {
    idClient: DataTypes.NUMBER,
    idHisto: DataTypes.NUMBER,
    idVendeur: DataTypes.NUMBER,
    idCampagne: DataTypes.NUMBER,
    idEtat: DataTypes.STRING,
    commentaire: DataTypes.STRING,
    date: DataTypes.DATE,
    prisavec:DataTypes.STRING,
    statut:DataTypes.STRING
  }, {});
  RDV.associate = function(models) {
    RDV.belongsTo(models.Client, {foreignKey: 'idClient'})
    RDV.belongsTo(models.Historique, {foreignKey: 'idHisto'})
    RDV.belongsTo(models.User, {foreignKey: 'idVendeur'})
    RDV.belongsTo(models.Etat, {foreignKey: 'idEtat'})
  };
  return RDV;
};
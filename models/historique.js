'use strict';
module.exports = (sequelize, DataTypes) => {
  const Historique = sequelize.define('Historique', {
    idAction: DataTypes.NUMBER,
    dateevent: DataTypes.DATE,
    commentaire: DataTypes.TEXT,
    idUser: DataTypes.NUMBER,
    idRdv: DataTypes.NUMBER
  }, {});
  Historique.associate = function(models) {
    Historique.belongsTo(models.User, {foreignKey: 'idUser'});
    Historique.belongsTo(models.Action, {foreignKey: 'idAction'});
    Historique.belongsTo(models.RDV, {foreignKey: 'idRdv'});
  };
  return Historique;
};
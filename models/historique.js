const moment = require('moment');

'use strict';
module.exports = (sequelize, DataTypes) => {
  const Historique = sequelize.define('Historique', {
    idAction: DataTypes.NUMBER,
    dateevent: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue('dateevent')).format('DD/MM/YYYY HH:mm');
      }
    },
    commentaire: DataTypes.TEXT,
    idClient: DataTypes.NUMBER,
    idUser: DataTypes.NUMBER,
    idRdv: DataTypes.NUMBER,
    createdAt:{
        type: DataTypes.DATE,
        get() {
          return moment(this.getDataValue('createdAt')).format('DD/MM/YYYY HH:mm');
        }
    }
  }, {});
  Historique.associate = function(models) {
    Historique.belongsTo(models.Client, {foreignKey: 'idClient'});
    Historique.belongsTo(models.User, {foreignKey: 'idUser'});
    Historique.belongsTo(models.Action, {foreignKey: 'idAction'});
    Historique.belongsTo(models.RDV, {foreignKey: 'idRdv'});
  };
  return Historique;
};
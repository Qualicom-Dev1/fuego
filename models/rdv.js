const moment = require('moment');

'use strict';
module.exports = (sequelize, DataTypes) => {
  const RDV = sequelize.define('RDV', {
    idClient: DataTypes.NUMBER,
    idHisto: DataTypes.NUMBER,
    idVendeur: DataTypes.NUMBER,
    idCampagne: DataTypes.NUMBER,
    idEtat: DataTypes.STRING,
    commentaire: DataTypes.STRING,
    r: DataTypes.NUMBER,
    date: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue('date')).format('DD/MM/YYYY HH:mm');
      }
    },
    prisavec:DataTypes.STRING,
    statut:DataTypes.STRING,
    source:DataTypes.STRING,
    facturation : {
      type : DataTypes.DATE,
      allowNull : true,
      defaultValue : null,
      get() {
        return this.getDataValue('facturation') !== null ? moment(this.getDataValue('facturation')).format('DD/MM/YYYY') : null
      },
      set(value) {
        this.setDataValue('facturation', value !== null ? moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD') : null)
      }
    },
    flagFacturationChange : {
      type : DataTypes.BOOLEAN,
      allowNull : false,
      defaultValue : false
    }
  }, {});
  RDV.associate = function(models) {
    RDV.belongsTo(models.Client, {foreignKey: 'idClient'})
    RDV.belongsTo(models.Historique, {foreignKey: 'idHisto'})
    RDV.belongsTo(models.User, {foreignKey: 'idVendeur'})
    RDV.belongsTo(models.Etat, {foreignKey: 'idEtat'})
    RDV.belongsTo(models.Campagne, {foreignKey: 'idCampagne'})
  };
  return RDV;
};
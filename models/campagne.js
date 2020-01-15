const moment = require('moment');

'use strict';
module.exports = (sequelize, DataTypes) => {
  const Campagne = sequelize.define('Campagne', {
    nom: DataTypes.STRING,
    sources_types: DataTypes.STRING,
    deps: DataTypes.STRING,
    statuts: DataTypes.STRING,
    prix: DataTypes.INTEGER,
    etat_campagne: DataTypes.INTEGER,
    createdAt: {
      type: DataTypes.DATE,
      get() {
        return moment(this.getDataValue('date')).format('DD/MM/YYYY HH:mm');
      }
    },
  }, {});
  Campagne.associate = function(models) {
    Campagne.belongsToMany(models.Client, {through: 'clientscampagne', foreignKey: 'idCampagne'})
  };
  return Campagne;
};
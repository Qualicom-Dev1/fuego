'use strict';
module.exports = (sequelize, DataTypes) => {
  const Campagne = sequelize.define('Campagne', {
    nom: DataTypes.STRING
  }, {});
  Campagne.associate = function(models) {
    Campagne.belongsToMany(models.Client, {through: 'clientscampagne', foreignKey: 'idCampagne'})
  };
  return Campagne;
};
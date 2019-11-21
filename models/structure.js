'use strict';
module.exports = (sequelize, DataTypes) => {
  const Structure = sequelize.define('Structure', {
    idType: DataTypes.INTEGER,
    nom: DataTypes.STRING,
    adresse: DataTypes.STRING,
    mail: DataTypes.STRING,
    tel: DataTypes.STRING,
    fax: DataTypes.STRING
  }, {});
  Structure.associate = function(models) {
    Structure.belongsTo(models.Type, {foreignKey: 'idType'})
    Structure.belongsToMany(models.User, {through: 'UserStructures', foreignKey: 'idStructure'})
    Structure.hasMany(models.Structuresdependence, {foreignKey: 'idStructure'})
  };
  return Structure;
};
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Usersdependence = sequelize.define('Usersdependence', {
    idUserSup: DataTypes.INTEGER,
    idUserInf: DataTypes.INTEGER
  }, {});
  Usersdependence.associate = function(models) {
    Usersdependence.belongsTo(models.User, {foreignKey: 'idUserSup'})
    Usersdependence.belongsTo(models.User, {foreignKey: 'idUserInf'})
  };
  return Usersdependence;
};
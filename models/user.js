'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    login: DataTypes.STRING,
    password: DataTypes.STRING,
    nom: DataTypes.STRING,
    prenom: DataTypes.STRING,
    mail: DataTypes.STRING,
    adresse: DataTypes.STRING,
    dep: DataTypes.INTEGER,
    birthday: DataTypes.DATE,
    tel1: DataTypes.STRING,
    tel2: DataTypes.STRING,
    telcall: DataTypes.STRING,
    billing: DataTypes.STRING,
    objectif: DataTypes.INTEGER,
    idRole: DataTypes.INTEGER,
    token: DataTypes.TEXT,
  }, {});
  User.associate = function(models) {
    User.belongsToMany(models.Structure, {through: 'UserStructures', foreignKey: 'idUser'})
    User.belongsTo(models.Role, {foreignKey: 'idRole'})
    User.hasOne(models.Directive, {foreignKey: 'idUser'})
    User.hasMany(models.Historique, {foreignKey: 'idUser'})
    User.hasMany(models.RDV, {foreignKey: 'idVendeur'})
    User.hasMany(models.Usersdependence, {foreignKey: 'idUserSup'})
  };
  return User;
};
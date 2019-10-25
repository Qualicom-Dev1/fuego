'use strict';
module.exports = (sequelize, DataTypes) => {
  const Secteur = sequelize.define('Secteur', {
    nom: DataTypes.TEXT,
    backgroundColor: DataTypes.TEXT
  }, {});
  Secteur.associate = function(models) {
    Secteur.hasMany(models.DepSecteur, {foreignKey: 'idSecteur'})  
    Secteur.belongsToMany(models.Client, {through: 'depSecteur', foreignKey: 'dep'})
  };
  return Secteur;
};
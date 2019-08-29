'use strict';
module.exports = (sequelize, DataTypes) => {
  const Privilege = sequelize.define('Privilege', {
    nom: DataTypes.STRING,
    url: DataTypes.STRING,
    categorie: DataTypes.STRING
  }, {});
  Privilege.associate = function(models) {
    Privilege.belongsToMany(models.Role, {through: 'roleprivileges', foreignKey: 'idPrivilege'})
  };
  return Privilege;
};
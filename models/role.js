'use strict';
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    nom: DataTypes.STRING,
    typeDuRole: DataTypes.STRING
  }, {});
  Role.associate = function(models) {
    Role.belongsToMany(models.Privilege, {through: 'roleprivileges', foreignKey: 'idRole'})
  };
  return Role;
};
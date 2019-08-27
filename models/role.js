'use strict';
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    nom: DataTypes.STRING
  }, {});
  Role.associate = function(models) {
    Role.belongsToMany(models.Privilege, {through: 'RolePrivileges', foreignKey: 'idPrivilege', as:'privileges'})
  };
  return Role;
};
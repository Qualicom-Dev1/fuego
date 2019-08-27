'use strict';
module.exports = (sequelize, DataTypes) => {
  const Privilege = sequelize.define('Privilege', {
    nom: DataTypes.STRING
  }, {});
  Privilege.associate = function(models) {
    Privilege.belongsToMany(models.Role, {through: 'RolePrivileges', foreignKey: 'idRole', as:'roles'})
  };
  return Privilege;
};
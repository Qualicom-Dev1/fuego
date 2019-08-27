'use strict';
module.exports = (sequelize, DataTypes) => {
  const RolePrivilege = sequelize.define('RolePrivilege', {
    idRole: DataTypes.INTEGER,
    idPrivilege: DataTypes.INTEGER
  }, {});
  RolePrivilege.associate = function(models) {
    RolePrivilege.belongsTo(models.Role, {foreignKey: 'idRole'})
    RolePrivilege.belongsTo(models.Privilege, {foreignKey: 'idPrivilege'})
  };
  return RolePrivilege;
};
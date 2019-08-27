'use strict';
module.exports = (sequelize, DataTypes) => {
  const RolePrivilege = sequelize.define('RolePrivilege', {
    idRole: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Roles',
        key: 'id'
      }
    },
    idPrivilege: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Privileges',
        key: 'id'
      }
    }
  }, {});
  RolePrivilege.associate = function(models) {
  };
  return RolePrivilege;
};
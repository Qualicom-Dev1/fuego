'use strict';
module.exports = (sequelize, DataTypes) => {
  const roleprivilege = sequelize.define('roleprivilege', {
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
  roleprivilege.associate = function(models) {
  };
  return roleprivilege;
};
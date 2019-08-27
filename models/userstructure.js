'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserStructure = sequelize.define('UserStructure', {
    idUser: DataTypes.INTEGER,
    idStructure: DataTypes.INTEGER
  }, {});
  UserStructure.associate = function(models) {
      UserStructure.belongsTo(models.User, {foreignKey: 'idUser'})
      UserStructure.belongsTo(models.Structure, {foreignKey: 'idStructure'})
  };
  return UserStructure;
};
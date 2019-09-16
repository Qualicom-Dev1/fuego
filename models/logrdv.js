'use strict';
module.exports = (sequelize, DataTypes) => {
  const logRdv = sequelize.define('logRdv', {
    idRdv: DataTypes.NUMBER,
    idEtat: DataTypes.NUMBER,
    idUser: DataTypes.NUMBER,
    statut: DataTypes.NUMBER
  }, {});
  logRdv.associate = function(models) {
    // associations can be defined here
  };
  return logRdv;
};
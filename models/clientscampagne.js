'use strict';
module.exports = (sequelize, DataTypes) => {
  const ClientsCampagne = sequelize.define('ClientsCampagne', {
    idClient: DataTypes.NUMBER,
    idCampagne: DataTypes.NUMBER
  }, {});
  ClientsCampagne.associate = function(models) {
    // associations can be defined here
  };
  return ClientsCampagne;
};
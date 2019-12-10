'use strict';
module.exports = (sequelize, DataTypes) => {
  const Source = sequelize.define('Source', {
    nom: DataTypes.STRING
  }, {});
  Source.associate = function(models) {
    // associations can be defined here
  };
  return Source;
};
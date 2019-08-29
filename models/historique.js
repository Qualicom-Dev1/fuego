'use strict';
module.exports = (sequelize, DataTypes) => {
  const Historique = sequelize.define('Historique', {
    idAction: DataTypes.NUMBER,
    dateevent: DataTypes.DATE,
    commentaire: DataTypes.TEXT,
    idUser: DataTypes.NUMBER,
    idRdv: DataTypes.NUMBER
  }, {});
  Historique.associate = function(models) {
    // associations can be defined here
  };
  return Historique;
};
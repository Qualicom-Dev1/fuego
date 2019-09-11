'use strict';
module.exports = (sequelize, DataTypes) => {
  const Directive = sequelize.define('Directive', {
    deps: DataTypes.STRING,
    idUser: DataTypes.NUMBER,
    idCampagne: DataTypes.NUMBER,
    type_de_fichier: DataTypes.STRING,
    sous_type: DataTypes.STRING
  }, {});
  Directive.associate = function(models) {
    Directive.belongsTo(models.User, {foreignKey: 'idUser'})
  };
  return Directive;
};
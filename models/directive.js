'use strict';
module.exports = (sequelize, DataTypes) => {
  const Directive = sequelize.define('Directive', {
    deps : {
      type : DataTypes.STRING(300),
      allowNull : true,
      defaultValue : null
    },
    idUser: DataTypes.NUMBER,
    campagnes: DataTypes.NUMBER,
    type_de_fichier: DataTypes.STRING,
    sous_type: DataTypes.STRING,
    idZone : {
      type : DataTypes.INTEGER,
      allowNull : true,
      defaultValue : null
    },
    idSousZone : {
      type : DataTypes.INTEGER,
      allowNull : true,
      defaultValue : null
    },
    idAgence : {
      type : DataTypes.INTEGER,
      allowNull : true,
      defaultValue : null
    },
    listeIdsVendeurs : {
      type : DataTypes.STRING(300),
      allowNull : true,
      defaultValue : null
    }
  }, {});
  Directive.associate = function(models) {
    Directive.belongsTo(models.User, {foreignKey: 'idUser'})
    Directive.belongsTo(models.Zone, { foreignKey : 'idZone' })
    Directive.belongsTo(models.SousZone, { foreignKey : 'idSousZone' })
    Directive.belongsTo(models.Agence, { foreignKey : 'idAgence' })
  };
  return Directive;
};
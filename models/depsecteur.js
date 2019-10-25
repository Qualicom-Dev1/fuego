'use strict';
module.exports = (sequelize, DataTypes) => {
  const DepSecteur = sequelize.define('DepSecteur', {
    idSecteur: DataTypes.NUMBER,
    dep: DataTypes.NUMBER
  }, {});
  DepSecteur.associate = function(models) {
  };
  return DepSecteur;
};
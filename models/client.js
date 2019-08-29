'use strict';
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    nom: DataTypes.STRING,
    prenom: DataTypes.STRING,
    tel1: DataTypes.STRING,
    tel2: DataTypes.STRING,
    tel3: DataTypes.STRING,
    adresse: DataTypes.STRING,
    cp: DataTypes.NUMBER,
    ville: DataTypes.STRING,
    relation: DataTypes.STRING,
    pro1: DataTypes.STRING,
    pdetail1: DataTypes.STRING,
    age1: DataTypes.NUMBER,
    pro2: DataTypes.STRING,
    pdetail2: DataTypes.STRING,
    age2: DataTypes.NUMBER,
    fioul: DataTypes.BOOLEAN,
    gaz: DataTypes.BOOLEAN,
    elec: DataTypes.BOOLEAN,
    bois: DataTypes.BOOLEAN,
    pac: DataTypes.BOOLEAN,
    autre: DataTypes.BOOLEAN,
    fchauffage: DataTypes.FLOAT,
    felec: DataTypes.FLOAT,
    surface: DataTypes.FLOAT,
    panneaux: DataTypes.BOOLEAN,
    annee: DataTypes.NUMBER,
    be: DataTypes.BOOLEAN,
    commentaire: DataTypes.TEXT,
    source: DataTypes.STRING,
    type: DataTypes.STRING
  }, {});
  Client.associate = function(models) {
    // associations can be defined here
  };
  return Client;
};
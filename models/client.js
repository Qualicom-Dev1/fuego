'use strict';
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    nom: {
      type: DataTypes.STRING,
      set(nom){
        this.setDataValue('nom', nom != null && typeof nom != 'undefined' ? nom.toUpperCase() : '');
      }
    },
    id_hitech: DataTypes.STRING,
    prenom: {
      type: DataTypes.STRING,
      set(prenom){
        this.setDataValue('prenom', prenom != null && typeof prenom != 'undefined' ? prenom.toUpperCase() : '');
      }
    },
    tel1: DataTypes.STRING,
    tel2: DataTypes.STRING,
    tel3: DataTypes.STRING,
    adresse: {
      type: DataTypes.STRING,
      set(adresse){
        this.setDataValue('adresse', adresse != null && typeof adresse != 'undefined' ? adresse.toUpperCase() : '');
      }
    },
    cp: DataTypes.NUMBER,
    dep: DataTypes.NUMBER,
    ville: DataTypes.STRING,
    relation: DataTypes.STRING,
    nbadultes: DataTypes.NUMBER,
    nbenfants: DataTypes.NUMBER,
    civil1: DataTypes.STRING,
    pro1: DataTypes.STRING,
    pdetail1: DataTypes.STRING,
    heuretravail1: DataTypes.STRING,
    age1: DataTypes.NUMBER,
    civil2: DataTypes.STRING,
    pro2: DataTypes.STRING,
    pdetail2: DataTypes.STRING,
    heuretravail2: DataTypes.STRING,
    age2: DataTypes.NUMBER,
    anneepropr: DataTypes.NUMBER,
    anneeconstr: DataTypes.NUMBER,
    etages: DataTypes.NUMBER,
    ci: DataTypes.BOOLEAN,
    dv: DataTypes.BOOLEAN,
    orientation: DataTypes.STRING,
    velux: DataTypes.NUMBER,
    chiens: DataTypes.NUMBER,
    fioul: DataTypes.BOOLEAN,
    agefioul: DataTypes.NUMBER,
    prixfioul: DataTypes.NUMBER,
    gaz: DataTypes.BOOLEAN,
    precgaz: DataTypes.STRING,
    agegaz: DataTypes.NUMBER,
    prixgaz: DataTypes.NUMBER,
    elec: DataTypes.BOOLEAN,
    precelec: DataTypes.STRING,
    ageelec: DataTypes.NUMBER,
    prixelec: DataTypes.NUMBER,
    cheminee: DataTypes.BOOLEAN,
    precchem: DataTypes.STRING,
    agechem: DataTypes.NUMBER,
    prixchem: DataTypes.NUMBER,
    poele: DataTypes.BOOLEAN,
    precpoele: DataTypes.STRING,
    agepoele: DataTypes.NUMBER,
    prixpoele: DataTypes.NUMBER,
    pacAA: DataTypes.BOOLEAN,
    agepacAA: DataTypes.NUMBER,
    prixpacAA: DataTypes.NUMBER,
    pacAE: DataTypes.BOOLEAN,
    agepacAE: DataTypes.NUMBER,
    prixpacAE: DataTypes.NUMBER,
    autre: DataTypes.BOOLEAN,
    ageautre: DataTypes.NUMBER,
    prixautre: DataTypes.NUMBER,
    surface: DataTypes.FLOAT,
    panneaux: DataTypes.BOOLEAN,
    annee: DataTypes.NUMBER,
    be: DataTypes.BOOLEAN,
    commentaire: DataTypes.TEXT,
    source: DataTypes.STRING,
    type: DataTypes.STRING,
    currentUser: DataTypes.INTEGER,
    currentAction: DataTypes.INTEGER,
    countNrp: DataTypes.INTEGER,
    currentCampagne: DataTypes.INTEGER,
  }, {});
  Client.associate = function(models) {
    Client.hasMany(models.Historique, {foreignKey: 'idClient'});
    Client.belongsToMany(models.Campagne, {through: 'clientscampagne', foreignKey: 'idClient'})
    Client.belongsTo(models.Secteur, {foreignKey: 'dep'});
  };
  return Client;
};
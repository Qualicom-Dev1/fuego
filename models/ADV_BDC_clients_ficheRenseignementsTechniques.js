const isSet = require('../routes/utils/isSet')

module.exports = (sequelize, DataTypes) => {
    const ADV_BDC_client_ficheRenseignementsTechniques = sequelize.define('ADV_BDC_client_ficheRenseignementsTechniques', 
        {
            typeInstallationElectrique : {
                type : DataTypes.ENUM('monophasée', 'triphasée'),
                allowNull : true,
                defaultValue : null,
                validate : {
                    isIn : {
                        args : [['monophasée','triphasée']],
                        msg : "L'installation électrique doit être soit monophasée, soit triphasée."
                    },
                }
            },
            puissanceKW : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : true,
                defaultValue : null,
                validate : {
                    puissance : value => {
                        if(isSet(value) && Number(value) <= 0) throw new Error("La puissance en KW doit être positive.")
                    }
                }
            },
            puissanceA : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : true,
                defaultValue : null,
                validate : {
                    puissance : value => {
                        if(isSet(value) && Number(value) <= 0) throw new Error("La puissance en A doit être positive.")
                    }
                }
            },
            anneeConstructionMaison : {
                type : DataTypes.INTEGER(4),
                allowNull : true,
                defaultValue : null,
                validate : {
                    is : {
                        args : /^(18|19|20|21){1}(\d){2}$/g,
                        msg : "L'année de construction de la maison est incorrecte."
                    }
                }
            },
            dureeSupposeeConstructionMaison : {
                type : DataTypes.INTEGER(3),
                allowNull : true,
                defaultValue : null,
                validate : {
                    age : value => {
                        if(isSet(value) && !(Number(value) > 0 && Number(value) <= 300)) throw new Error("L'approximation de la construction de la maison doit être positive et de moins de 300ans.")
                    }
                }
            },
            dureeAcquisitionMaison : {
                type : DataTypes.INTEGER(3),
                allowNull : true,
                defaultValue : null,
                validate : {
                    age : value => {
                        if(isSet(value) && !(Number(value) > 0 && Number(value) <= 150)) throw new Error("La durée d'acquisition de la maison doit être positive et ne peut excéder 150ans.")
                    }
                }
            },
            typeResidence : {
                type : DataTypes.ENUM('principale', 'secondaire'),
                allowNull : true,
                defaultValue : null,
                validate : {
                    isIn : {
                        args : [['principale','secondaire']],
                        msg : "La résidence doit être principale ou secondaire."
                    },
                }
            },
            superficie : {
                type : DataTypes.INTEGER,
                allowNull : true,
                defaultValue : null,
                validate : {
                    min : {
                        args : 15,
                        msg : "La superficie doit être au minimum de 15m²."
                    }
                }
            }
        }, 
        {
            name : {
                singular : 'ADV_BDC_client_ficheRenseignementsTechniques',
                plural : 'ADV_BDC_clients_ficheRenseignementsTechniques'
            },
            tableName : 'ADV_BDC_clients_ficheRenseignementsTechniques'
        }
    )

    ADV_BDC_client_ficheRenseignementsTechniques.associate = models => {

    }

    return ADV_BDC_client_ficheRenseignementsTechniques
}
const moment = require('moment')

module.exports = (sequelize, DataTypes) => {
    const ADV_BDC = sequelize.define('ADV_BDC', 
        {
            ref : {
                type : DataTypes.STRING(256),
                allowNull : false
            },
            idADV_BDC_client : {
                type : DataTypes.INTEGER,
                allowNull : false,
                references : {
                    model : 'ADV_BDC_clients',
                    key : 'id'
                }
            },
            idVendeur : {
                type : DataTypes.INTEGER,
                allowNull : false,
                references : {
                    model : 'Users',
                    key : 'id'
                }
            },
            prixHT : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le prix HT doit être positif."
                    },
                    notNull : {
                        msg : "Le prix HT doit être indiqué."
                    }
                }
            },
            prixTTC : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le prix TTC doit être positif."
                    },
                    notNull : {
                        msg : "Le prix TTC doit être indiqué."
                    }
                }
            },
            montantTVA : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le montant de la TVA doit être positif."
                    },
                    notNull : {
                        msg : "Le montant de la TVA doit être indiqué."
                    }
                }
            },
            datePose : {
                type : DataTypes.DATE,
                allowNull : false,
                get() {
                    return moment(this.getDataValue('datePose')).format('DD/MM/YYYY')
                },
                set(value) {
                    this.setDataValue('datePose', moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD'))
                },
                validate : {
                    isFutureDate : function(value) {
                        if(moment(value, 'DD/MM/YYYY').isBefore(moment(), 'day')) throw new Error("La date de pose ne peut pas être antérieur à la date du jour.")
                    }
                }
            },
            dateLimitePose : {
                type : DataTypes.DATE,
                allowNull : false,
                get() {
                    return moment(this.getDataValue('dateLimitePose')).format('DD/MM/YYYY')
                },
                set(value) {
                    this.setDataValue('dateLimitePose', moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD'))
                },
                validate : {
                    isFutureDate : function(value) {
                        if(moment(value, 'DD/MM/YYYY').isBefore(moment(), 'day')) throw new Error("La date limite de pose ne peut pas être antérieur à la date du jour.")
                        if(moment(value, 'DD/MM/YYYY').isBefore(moment(this.getDataValue('datePose'), 'DD/MM/YYYY'))) throw new Error("La date limite de pose ne peut pas être antérieur à la date de pose.")
                    }
                }
            },
            observations : {
                type : DataTypes.STRING(1000),
                allowNull : false,
                defaultValue : '',
                validate : {
                    len : {
                        args : [0,1000],
                        msg : "Les observations sont limitées à 1000 caractères."
                    }
                }
            },
            idADV_BDC_infoPaiement : {
                type : DataTypes.INTEGER,
                allowNull : false,
                references : {
                    model : 'ADV_BDC_infoPaiements',
                    key : 'id'
                }
            },
            idADV_BDC_ficheAcceptation : {
                type : DataTypes.INTEGER,
                allowNull : false,
                references : {
                    model : 'ADV_BDC_ficheAcceptations',
                    key : 'id'
                }
            },
            lienDocuments : {
                type : DataTypes.STRING(500),
                allowNull : true,
                defaultValue : null
            },
            isValidated : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : false
            },
            isCanceled : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : false
            },
            idStructure : {
                type : DataTypes.NUMBER,
                allowNull : false,
                references : {
                    model : 'Structures',
                    key : 'id'
                }
            }
        }, 
        {
            name : {
                singular : 'ADV_BDC',
                plural : 'ADV_BDCs'
            },
            tableName : 'ADV_BDCs'
        }
    )

    ADV_BDC.associate = models => {
        ADV_BDC.belongsTo(models.ADV_BDC_client, { as : 'client', foreignKey : 'idADV_BDC_client' })
        ADV_BDC.belongsTo(models.User, { as : 'vendeur', foreignKey : 'idVendeur' })
        ADV_BDC.belongsTo(models.Structure, { foreignKey : 'idStructure' })
        ADV_BDC.belongsTo(models.ADV_BDC_infoPaiement, { as : 'infosPaiement', foreignKey : 'idADV_BDC_infoPaiement' })
        ADV_BDC.belongsTo(models.ADV_BDC_ficheAcceptation, { as : 'ficheAcceptation', foreignKey : 'idADV_BDC_ficheAcceptation' })
        ADV_BDC.belongsToMany(models.ADV_BDC_produit, { as : 'listeProduits', through : models.ADV_BDC_BDCListeProduits, foreignKey : 'idBDC', otherKey : 'idProduit' })
    }

    return ADV_BDC
}
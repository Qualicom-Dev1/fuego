const moment = require('moment')

module.exports = (sequelize, DataTypes) => {
    const ADV_BDC = sequelize.define('ADV_BDC', 
        {
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
            listeIdsProduits : {
                type : DataTypes.STRING(1000),
                allowNull : true,
                validate : {
                    is : {
                        args : /^(\d+,)+(\d+){1}$/g,
                        msg : "Liste de produits incorrecte."
                    }
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
                    isFutureDate : value => {

                    }
                }
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
        ADV_BDC.belongsTo(models.User, { foreignKey : 'idVendeur' })
        ADV_BDC.belongsTo(models.Structure, { foreignKey : 'idStructure' })
        // ADV_BDC.belongsTo(models.ADV_produit, { foreignKey : 'idADV_produit' })
    }

    return ADV_BDC
}

function isFutureDate(value, sujet, accord) {
    if(moment(value, 'DD/MM/YYYY').isBefore(moment(), 'day')) throw `${sujet} ne peut pas être antérieur${accord} à la date du jour.`
}
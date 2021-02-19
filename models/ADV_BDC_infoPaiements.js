const moment = require('moment')
const isSet = require('../routes/utils/isSet')

module.exports = (sequelize, DataTypes) => {
    const ADV_BDC_infoPaiement = sequelize.define('ADV_BDC_infoPaiement', 
        {
            idADV_BDC_client : {
                type : DataTypes.INTEGER,
                allowNull : false,
                references : {
                    model : 'ADV_BDC_clients',
                    key : 'id'
                }
            },
            isAcompte : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : false
            },
            typeAcompte : {
                type : DataTypes.ENUM('CHÈQUE', 'ESPÈCES'),
                allowNull : true,
                defaultValue : null,
                validate : {
                    isIn : {
                        args : [['CHÈQUE','ESPÈCES']],
                        msg : "L'acompte doit se faire soit par chèque, soit en espèces."
                    },
                    isAcompte : value => {
                        if(isSet(value) && !!this.getDataValue('isAcompte') === false) throw new Error(`Pour remplir la modalité de paiement de l'acompte, 'Acompte' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isAcompte')) throw new Error("La modalité de paiement de l'acompte doit être renseignée.")
                    }
                }
            },
            montantAcompte : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    min : {
                        args : 0,
                        msg : "L'acompte doit être positif."
                    },
                    isAcompte : value => {
                        if(Number(value) !== 0 && !!this.getDataValue('isAcompte') === false) throw new Error(`Pour remplir le montant d'acompte, 'Acompte' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isAcompte')) throw new Error("Le montant de l'acompte doit être renseigné.")
                    },                    
                }
            },
            isComptant : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : false
            },
            montantComptant : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    min : {
                        args : 0,
                        msg : "Le montant du paiement comptant doit être positif."
                    },
                    isComptant : value => {
                        if(Number(value) !== 0 && !!this.getDataValue('isComptant') === false) throw new Error(`Pour remplir le montant du paiement comptant, 'Paiement comptant' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isComptant')) throw new Error("Le montant du paiement comptant doit être renseigné.")
                    },                    
                }
            },
            isCredit : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : false
            },
            montantCredit : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    min : {
                        args : 0,
                        msg : "Le montant du crédit doit être positif."
                    },
                    isCredit : value => {
                        if(Number(value) !== 0 && !!this.getDataValue('isCredit') === false) throw new Error(`Pour remplir le montant du crédit, 'Paiement via un organisme de crédit' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isCredit')) throw new Error("Le montant du crédit doit être renseigné.")
                    },                    
                }
            },
            nbMensualiteCredit : {
                type : DataTypes.INTEGER,
                allowNull : false,
                defaultValue : 0,
                validate : {
                    min : {
                        args : 0,
                        msg : "Le nombre de mensualités du crédit doit être positif."
                    },
                    isCredit : value => {
                        if(Number(value) !== 0 && !!this.getDataValue('isCredit') === false) throw new Error(`Pour remplir le nombre de mensualités du crédit, 'Paiement via un organisme de crédit' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isCredit')) throw new Error("Le nombre de mensualités du crédit doit être renseigné.")
                    },                    
                }
            },
            montantMensualiteCredit : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    min : {
                        args : 0,
                        msg : "Le montant des mensualités du crédit doit être positif."
                    },
                    isCredit : value => {
                        if(Number(value) !== 0 && !!this.getDataValue('isCredit') === false) throw new Error(`Pour remplir le montant des mensualités du crédit, 'Paiement via un organisme de crédit' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isCredit')) throw new Error("Le montant des mensualités du crédit doit être renseigné.")
                    },                    
                }
            },
            nbMoisReportCredit : {
                type : DataTypes.INTEGER,
                allowNull : false,
                defaultValue : 0,
                validate : {
                    min : {
                        args : 0,
                        msg : "Le nombre de mois de report du crédit doit être positif."
                    },
                    isCredit : value => {
                        if(Number(value) !== 0 && !!this.getDataValue('isCredit') === false) throw new Error(`Pour remplir le nombre de mois de report du crédit, 'Paiement via un organisme de crédit' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isCredit')) throw new Error("Le nombre de mois de report du crédit doit être renseigné.")
                    },                    
                }
            },
            tauxNominalCredit : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    min : {
                        args : 0,
                        msg : "Le taux nominal du crédit doit être positif."
                    },
                    isCredit : value => {
                        if(Number(value) !== 0 && !!this.getDataValue('isCredit') === false) throw new Error(`Pour remplir le taux nominal du crédit, 'Paiement via un organisme de crédit' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isCredit')) throw new Error("Le taux nominal du crédit doit être renseigné.")
                    },                    
                }
            },
            tauxEffectifGlobalCredit : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    min : {
                        args : 0,
                        msg : "Le taux effectif global du crédit doit être positif."
                    },
                    isCredit : value => {
                        if(Number(value) !== 0 && !!this.getDataValue('isCredit') === false) throw new Error(`Pour remplir le taux effectif global du crédit, 'Paiement via un organisme de crédit' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isCredit')) throw new Error("Le taux effectif global du crédit doit être renseigné.")
                    },                    
                }
            },
            datePremiereEcheanceCredit : {
                type : DataTypes.DATE,
                allowNull : true,
                defaultValue : null,
                get() {
                    return isSet(this.getDataValue('datePremiereEcheanceCredit')) ? moment(this.getDataValue('datePremiereEcheanceCredit')).format('DD/MM/YYYY') : null
                },
                set(value) {
                    this.setDataValue('datePremiereEcheanceCredit', isSet(value) ? moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD') : null)
                },
                validate : {
                    isCredit : value => {
                        if(Number(value) !== 0 && !!this.getDataValue('isCredit') === false) throw new Error(`Pour remplir la date de première échéance du crédit, 'Paiement via un organisme de crédit' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isCredit')) throw new Error("La date de première échéance du crédit doit être renseignée.")
                    },
                    isFutureDate : value => {
                        if(value !== null && moment(value, 'DD/MM/YYYY').isBefore(moment(), 'day')) throw new Error("La date de première échéance du crédit ne peut pas être antérieur au jour détablissement du bon de commande.")
                    }
                }
            },
            coutTotalCredit : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    min : {
                        args : 0,
                        msg : "Le coût total du crédit doit être positif."
                    },
                    isCredit : value => {
                        if(Number(value) !== 0 && !!this.getDataValue('isCredit') === false) throw new Error(`Pour remplir le coût total du crédit, 'Paiement via un organisme de crédit' doit être coché.`)
                        if(!isSet(value) && !!this.getDataValue('isCredit')) throw new Error("Le coût total du crédit doit être renseigné.")
                    },                    
                }
            }
        }, 
        {
            name : {
                singular : 'ADV_BDC_infoPaiement',
                plural : 'ADV_BDC_infoPaiements'
            },
            tableName : 'ADV_BDC_infoPaiements'
        }
    )

    ADV_BDC_infoPaiement.associate = models => {
        ADV_BDC_infoPaiement.belongsTo(models.ADV_BDC_client, { foreignKey : 'idADV_BDC_client' })
    }

    return ADV_BDC_infoPaiement
}
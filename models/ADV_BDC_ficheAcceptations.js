const moment = require('moment')

module.exports = (sequelize, DataTypes) => {
    const ADV_BDC_ficheAcceptation = sequelize.define('ADV_BDC_ficheAcceptation', 
        {
            client : {
                type : DataTypes.STRING(512),
                allowNull : false,
                validate : {
                    len : {
                        args : [1, 512],
                        msg : 'Le nom, prénom du client est limité à 512 caractères.'
                    },
                    notNull : {
                        msg : "Le nom, prénom du client doit être indiqué."
                    }
                }
            },
            adresse : {
                type : DataTypes.STRING(1500),
                allowNull : false,
                validate : {
                    len : {
                        args : [1, 1500],
                        msg : "L'adresse d'établissement du contrat est limité à 1500 caractères."
                    },
                    notNull : {
                        msg : "L'adresse d'établissement du contrat doit être indiquée."
                    }
                }
            },
            date : {
                type : DataTypes.DATE,
                allowNull : false,
                get() {
                    return moment(this.getDataValue('date')).format('DD/MM/YYYY')
                },
                set(value) {
                    this.setDataValue('date', moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD'))
                },
            },
            heure : {
                type : DataTypes.STRING(5),
                allowNull : false,
                validate : {
                    len : {
                        args : [5,5],
                        msg : "L'heure d'établissement du contrat"
                    },
                    isCorrectTime : function(value) {
                        if(value !== null && value && !/^(([0-1]{1}[0-9]{1})|(2[0-3]{1})){1}:[0-5]{1}[0-9]{1}$/g.test(value)) {
                            throw new Error("Le format de l'heure d'établissement du contrat est incorrect.")
                        }
                    }
                }
            },
            technicien : {
                type : DataTypes.STRING(512),
                allowNull : false,
                validate : {
                    len : {
                        args : [1, 512],
                        msg : 'Le nom, prénom du technicien est limité à 512 caractères.'
                    },
                    notNull : {
                        msg : "Le nom, prénom du technicien doit être indiqué."
                    }
                }
            },
            isReceptionDocuments : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : false
            }
        }, 
        {
            name : {
                singular : 'ADV_BDC_ficheAcceptation',
                plural : 'ADV_BDC_ficheAcceptations'
            },
            tableName : 'ADV_BDC_ficheAcceptations'
        }
    )

    ADV_BDC_ficheAcceptation.associate = models => {
        
    }

    return ADV_BDC_ficheAcceptation
}
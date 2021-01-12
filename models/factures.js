const moment = require('moment')

module.exports = (sequelize, DataTypes) => {
    const Facture = sequelize.define('Facture', 
        {
            refFacture : {
                type : DataTypes.STRING(100),
                allowNull : false,
                unique : {
                    args : true,
                    msg : "Le numéro de référence facture doit être unique."
                },
                validate : {
                    len : {
                        args : [3, 100],
                        msg : "Le numéro de référence de la facture doit être compris entre 3 et 100 caractères."
                    },
                    notNull : {
                        msg : "Le numéro de référence de la facture doit être indiqué."
                    }
                }
            },
            idDevis : {
                type : DataTypes.INTEGER,
                allowNull : true,
                defaultValue : null
            },
            idPrestation : {
                type : DataTypes.INTEGER,
                allowNull: false,
                validate : {
                    notNull : {
                        msg : "La facture doit être liée à une prestation."
                    }
                }
            },
            dateEmission : {
                type : DataTypes.DATE,
                allowNull : false,
                defaultValue : sequelize.literal('CURRENT_TIMESTAMP'),
                get() {
                    return moment(this.getDataValue('dateEmission')).format('DD/MM/YYYY HH:mm')
                },
                set(value) {
                    this.setDataValue('dateEmission', moment(value, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm:00'))
                }
            },
            dateEcheance : {
                type : DataTypes.DATE,
                allowNull : false,
                validate : {
                    notNull : {
                        msg : "La date d'échéance de paiement doit être indiquée."
                    }
                },
                get() {
                    return moment(this.getDataValue('dateEcheance')).format('DD/MM/YYYY')
                },
                set(value) {
                    this.setDataValue('dateEcheance', moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD'))
                }
            },
            type : {
                type : DataTypes.ENUM('acompte','avoir','solde'),
                allowNull : false,
                defaultValue : 'solde',
                validate : {
                    isIn : {
                        args : [['acompte','avoir','solde']],
                        msg : "Le type de facture doit être soit d'acompte, soit d'avoir soit du solde."
                    },
                    notNull : {
                        msg : "Le type de facture doit être indiqué."
                    }
                }
            },
            tva : {
                type : DataTypes.FLOAT,
                allowNull : false,
                defaultValue : 20,
                validate : {
                    min : {
                        args : 2.1,
                        msg : "Le taux minimal de TVA doit être de 2,1%."
                    },
                    notNull : {
                        msg : "Le taux de TVA doit être indiqué."
                    }
                }
            },
            remise : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "La remise ne peut pas être négative."
                    },
                    notNull : {
                        msg : "Une remise nulle doit être mise à 0 (zéro)."
                    }
                }
            },
            idTypePaiement : {
                type : DataTypes.INTEGER,
                allowNull : true,
                defaultValue : null
            },
            valeurAcompte : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "L'acompte doit forcément être positif."
                    },
                    notNull : {
                        msg : "L'acompte doit être renseigné."
                    }
                }
            },
            isAcomptePourcentage : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : 0
            },
            datePaiement : {
                type : DataTypes.DATE,
                allowNull : true,
                defaultValue : null,
                get() {
                    return this.getDataValue('datePaiement') !== null ? moment(this.getDataValue('datePaiement')).format('DD/MM/YYYY') : null
                },
                set(value) {
                    this.setDataValue('datePaiement', value !== null ? moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD') : null)
                }
            },
            prixHT : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le prix doit forcément être positif."
                    },
                    notNull : {
                        msg : "Le prix HT doit être renseigné."
                    }
                }
            },
            prixTTC : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                defaultValue : 0,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le prix doit forcément être positif."
                    },
                    notNull : {
                        msg : "Le prix TTC doit être renseigné."
                    }
                }
            },
            idFactureReferente : {
                type : DataTypes.INTEGER,
                allowNull : true,
                defaultValue : null
            },
            isCanceled : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : 0
            },
            idFactureAnnulee : {
                type : DataTypes.INTEGER,
                allowNull : true,
                defaultValue : null
            }
        }, 
        {
            
        }
    )

    Facture.associate = models => {
        Facture.belongsTo(models.Devis, { foreignKey : 'idDevis' })
        Facture.belongsTo(models.Prestation, { foreignKey : 'idPrestation' })
        Facture.belongsTo(models.TypePaiement, { foreignKey : 'idTypePaiement' })
        Facture.belongsTo(models.Facture, { foreignKey : 'idFactureReferente', as : 'FactureReferente' })
        Facture.belongsTo(models.Facture, { foreignKey : 'idFactureAnnulee', as : 'FactureAnnulee' })
    }

    return Facture
}
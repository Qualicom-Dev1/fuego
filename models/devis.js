module.exports = (sequelize, DataTypes) => {
    const Devis = sequelize.define('Devis', 
        {
            refDevis : {
                type : DataTypes.STRING(100),
                allowNull : false,
                validate : {
                    len : {
                        args : [3, 100],
                        msg : "Le numéro de référence du devis doit être compris entre 3 et 100 caractères."
                    },
                    notNull : {
                        msg : "Le numéro de référence du devis doit être indiqué."
                    }
                }
            },
            idPrestation : {
                type : DataTypes.INTEGER,
                allowNull : false,
                validate : {
                    notNull : {
                        msg : "Le devis doit être lié à une prestation."
                    }
                }
            },
            isValidated : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : 0
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
            isCanceled : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : 0
            }
        }, 
        {
            name : {
                singular : 'Devis',
                plural : 'Devis'
            }
        }
    )

    Devis.associate = models => {
        Devis.belongsTo(models.Prestation, { foreignKey : 'idPrestation' })
    }

    return Devis
}
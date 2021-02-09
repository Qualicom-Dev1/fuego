const isSet = require('../routes/utils/isSet')

module.exports = (sequelize, DataTypes) => {
    const ADV_BDC_produit = sequelize.define('ADV_BDC_produit', 
        {
            idADV_produit : {
                type : DataTypes.INTEGER,
                allowNull : false
            },
            ref : {
                type : DataTypes.STRING(256),
                allowNull : true,
                defaultValue : null
            },
            designation : {
                type : DataTypes.STRING(500),
                allowNull : false,
                defaultValue : '',
                validate : {
                    len : {
                        args : [0, 500],
                        msg : 'La désigantion est limitée à 500 caractères.'
                    }
                }
            },
            description : {
                type : DataTypes.STRING(1000),
                allowNull : false,
                defaultValue : '',
                validate : {
                    len : {
                        args : [0, 1000],
                        msg : 'La description est limitée à 1000 caractères.'
                    }
                }
            },
            caracteristique : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : true,
                defaultValue : null,
                validate : {
                    isNumeric : {
                        msg : "La caractéristique technique du produit doit être une valeur numérique."
                    }
                }
            },
            uniteCaracteristique : {
                type : DataTypes.STRING(5),
                allowNull : true,
                defaultValue : null,
                validate : {
                    len : {
                        args : [1,5],
                        msg : "La taille de l'unité de mesure de la caractéristique technique doit être comprise entre 1 et 5 caractères."
                    },
                    isCaracteristique : value => {
                        if(isSet(value) && !isSet(this.getDataValue('caracteristique'))) throw new Error("La caractéristique technique doit être renseignée pour ajouter son unité de mesure.")
                        if(!isSet(value) && isSet(this.getDataValue('caracteristique'))) throw new Error("L'unité de mesure de la caractéristique technique doit être renseignée.")
                    }
                }
            },
            isGroupe : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : false
            },
            listeIdsProduits : {
                type : DataTypes.STRING(1000),
                allowNull : true,
                defaultValue : null,
                validate : {
                    is : {
                        args : /^(\d+,)+(\d+){1}$/g,
                        msg : "Liste de produits incorrecte."
                    }
                }
            },
            prixUnitaireHT : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le prix unitaire HT doit être positif."
                    },
                    notNull : {
                        msg : "Le prix unitaire HT doit être indiqué."
                    }
                }
            },
            prixUnitaireTTC : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le prix unitaire TTC doit être positif."
                    },
                    notNull : {
                        msg : "Le prix unitaire TTC doit être indiqué."
                    }
                }
            },
            tauxTVA : {
                type : DataTypes.DECIMAL(4,2),
                allowNull : false,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le taux de la TVA doit être positif."
                    },
                    notNull : {
                        msg : "Le taux de la TVA doit être indiqué."
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
        }, 
        {
            name : {
                singular : 'ADV_BDC_produit',
                plural : 'ADV_BDC_produits'
            },
            tableName : 'ADV_BDC_produits'
        }
    )

    ADV_BDC_produit.associate = models => {
        ADV_BDC_produit.belongsTo(models.ADV_produit, { foreignKey : 'idADV_produit' })
    }

    return ADV_BDC_produit
}
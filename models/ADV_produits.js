module.exports = (sequelize, DataTypes) => {
    const ADV_produit = sequelize.define('ADV_produit', 
        {
            ref : {
                type : DataTypes.STRING(256),
                allowNull : true,
                defaultValue : null
            },
            nom : {
                type : DataTypes.STRING(256),
                allowNull : false,
                validate : {
                    len : {
                        args : [0, 256],
                        msg : 'Le nom du produit est limité à 256 caractères.'
                    },
                    notNull : {
                        msg : "Le nom du produit doit être indiqué."
                    }
                }
            },
            designation : {
                type : DataTypes.STRING(500),
                allowNull : true,
                validate : {
                    len : {
                        args : [0, 500],
                        msg : 'La désigantion est limitée à 500 caractères.'
                    }
                }
            },
            description : {
                type : DataTypes.STRING(1000),
                allowNull : true,
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
                defaultValue : null
            },
            uniteCaracteristique : {
                type : DataTypes.STRING(5),
                allowNull : true,
                defaultValue : null
            },
            isGroupe : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : false
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
            tva : {
                type : DataTypes.DECIMAL(4,2),
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
            idStructure : {
                type : DataTypes.NUMBER,
                allowNull : false
            }
        }, 
        {
            name : {
                singular : 'ADV_produit',
                plural : 'ADV_produits'
            },
            tableName : 'ADV_produits'
        }
    )

    ADV_produit.associate = models => {
        ADV_produit.belongsTo(models.Structure, { foreignKey : 'idStructure' })
        // ADV_produit.belongsToMany(models.Prestation, { through : 'ADV_produit_Prestation', foreignKey : 'idProduit' })
    }

    return ADV_produit
}
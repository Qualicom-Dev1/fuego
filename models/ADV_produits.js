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
            // listeIdsProduits : {
            //     type : DataTypes.STRING(1000),
            //     allowNull : true,
            //     defaultValue : null,
            //     validate : {
            //         is : {
            //             args : /^(\d+,)+(\d+){1}$/g,
            //             msg : "Liste de produits incorrecte."
            //         }
            //     }
            // },
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
                singular : 'ADV_produit',
                plural : 'ADV_produits'
            },
            tableName : 'ADV_produits'
        }
    )

    ADV_produit.associate = models => {
        ADV_produit.belongsTo(models.Structure, { foreignKey : 'idStructure' })
        ADV_produit.belongsToMany(models.ADV_categorie, { as : 'categories', through : 'ADV_produitsCategories', foreignKey : 'idProduit', otherKey : 'idCategorie' })
        ADV_produit.belongsToMany(models.ADV_produit, { as : 'produits', through : models.ADV_produitListeProduits, foreignKey : 'idGroupeProduit', otherKey : 'idProduitListe' })
        ADV_produit.belongsToMany(models.ADV_produit, { as : 'groupes', through : models.ADV_produitListeProduits, foreignKey : 'idProduitListe', otherKey : 'idGroupeProduit' })
    }

    return ADV_produit
}
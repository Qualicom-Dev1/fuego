module.exports = (sequelize, DataTypes) => {
    const ADV_BDC_produitListeProduits = sequelize.define('ADV_BDC_produitListeProduits', 
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            idGroupeProduit : {
                type : DataTypes.INTEGER,
                references : {
                    model : 'ADV_BDC_produits',
                    key : 'id'
                }
            },
            idProduitListe : {
                type : DataTypes.INTEGER,
                references : {
                    model : 'ADV_BDC_produits',
                    key : 'id'
                }
            },
            isGroupe : {
                type : DataTypes.BOOLEAN,
                allowNull : false,
                defaultValue : false
            },
            quantite : {
                type : DataTypes.INTEGER,
                allowNull : false,
                defaultValue : 1,
                validate : {
                    isInt : {
                        args : {
                            min : 0
                        },
                        msg : "La quantité doit être positive." 
                    }
                }
            },
            prixUnitaireHTApplique : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le prix unitaire HT appliqué doit être positif."
                    },
                    notNull : {
                        msg : "Le prix unitaire HT appliqué doit être indiqué."
                    }
                }
            },
            prixUnitaireTTCApplique : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : false,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le prix unitaire TTC appliqué doit être positif."
                    },
                    notNull : {
                        msg : "Le prix unitaire TTC appliqué doit être indiqué."
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
            tauxTVA : {
                type : DataTypes.DECIMAL(4,2),
                allowNull : true,
                defaultValue : null,
                validate : {
                    isDecimal : {
                        args : {
                            min : 0
                        },
                        msg : "Le taux de la TVA doit être positif."
                    },
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
                singular : 'ADV_BDC_produitListeProduits',
                plural : 'ADV_BDC_produitsListeProduits'
            },
            tableName : 'ADV_BDC_produitsListeProduits'
        }
    )

    ADV_BDC_produitListeProduits.associate = models => {
    
    }

    return ADV_BDC_produitListeProduits
}
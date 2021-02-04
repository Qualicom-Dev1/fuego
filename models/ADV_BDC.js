module.exports = (sequelize, DataTypes) => {
    const ADV_BDC = sequelize.define('ADV_BDC', 
        {
            
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
        // ADV_BDC.belongsTo(models.ADV_produit, { foreignKey : 'idADV_produit' })
    }

    return ADV_BDC
}
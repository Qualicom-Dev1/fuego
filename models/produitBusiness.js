module.exports = (sequelize, DataTypes) => {
    const ProduitBusiness = sequelize.define('ProduitBusiness', 
        {
            nom : {
                type : DataTypes.SRING(256),
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
                type : DataTypes.STRING(256),
                allowNull : true,
                validate : {
                    len : {
                        args : [0, 256],
                        msg : 'La désigantion est limitée à 256 caractères.'
                    }
                }
            },
            prixUnitaire : {
                type : DataTypes.FLOAT,
                allowNull : false,
                validate : {
                    min : {
                        args : 0,
                        msg : "Le prix unitaire doit être positif."
                    },
                    notNull : {
                        msg : "Le prix unitaire doit être indiqué."
                    }
                }
            }
        }, 
        {
            name : {
                singular : 'ProduitBusiness',
                plural : 'ProduitsBusiness'
            }
        }
    )

    ProduitBusiness.associate = models => {
        ProduitBusiness.belongsToMany(models.Prestation, { through : 'ProduitBusiness_Prestation', foreignKey : 'idProduit' })
    }

    return ProduitBusiness
}
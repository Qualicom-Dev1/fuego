module.exports = (sequelize, DataTypes) => {
    const ADV_BDC_categorie = sequelize.define('ADV_BDC_categorie', 
        {
            idADV_categorie : {
                type : DataTypes.INTEGER,
                allowNull : true,
                defaultValue : null
            },
            nom : {
                type : DataTypes.STRING(256),
                allowNull : false,
                validate : {
                    len : {
                        args : [0, 256],
                        msg : 'Le nom de la catégorie est limité à 256 caractères.'
                    },
                    notNull : {
                        msg : "Le nom la catégorie doit être indiqué."
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
        }, 
        {
            name : {
                singular : 'ADV_BDC_categorie',
                plural : 'ADV_BDC_categories'
            },
            tableName : 'ADV_BDC_categories'
        }
    )

    ADV_BDC_categorie.associate = models => {
        ADV_BDC_categorie.belongsTo(models.ADV_categorie, { foreignKey : 'idADV_categorie' })
        ADV_BDC_categorie.belongsToMany(models.ADV_BDC_produit, { as : 'produits', through : 'ADV_BDC_produitsCategories', foreignKey : 'idCategorie', otherKey : 'idProduit' })
    }

    return ADV_BDC_categorie
}
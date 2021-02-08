module.exports = (sequelize, DataTypes) => {
    const ADV_produitsCategorie = sequelize.define('ADV_produitsCategorie', 
        {
            idCategorie : {
                type : DataTypes.INTEGER,
                references : {
                    model : 'ADV_categories',
                    key : 'id'
                }
            },
            idProduit : {
                type : DataTypes.INTEGER,
                references : {
                    model : 'ADV_produits',
                    key : 'id'
                }
            }
        }, 
        {
            name : {
                singular : 'ADV_produitsCategorie',
                plural : 'ADV_produitsCategories'
            },
            tableName : 'ADV_produitsCategories'
        }
    )

    ADV_produitsCategorie.associate = models => {
        // models.ADV_categorie.belongsToMAny(models.ADV_produit, { through : ADV_produitsCategorie })
        // models.ADV_produit.belongsToMAny(models.ADV_categorie, { through : ADV_produitsCategorie })
    }

    return ADV_produitsCategorie
}
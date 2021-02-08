module.exports = (sequelize, DataTypes) => {
    const ADV_categorie = sequelize.define('ADV_categorie', 
        {
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
                allowNull : true,
                validate : {
                    len : {
                        args : [0, 1000],
                        msg : 'La description est limitée à 1000 caractères.'
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
                singular : 'ADV_categorie',
                plural : 'ADV_categories'
            },
            tableName : 'ADV_categories'
        }
    )

    ADV_categorie.associate = models => {
        ADV_categorie.belongsTo(models.Structure, { foreignKey : 'idStructure' })
        ADV_categorie.belongsToMany(models.ADV_produit, { through : 'ADV_produitsCategories', foreignKey : 'idCategorie' })
    }

    return ADV_categorie
}
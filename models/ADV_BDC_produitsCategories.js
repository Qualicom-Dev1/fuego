module.exports = (sequelize, DataTypes) => {
    const ADV_BDC_produitsCategorie = sequelize.define('ADV_BDC_produitsCategorie', 
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            idCategorie : {
                type : DataTypes.INTEGER,
                references : {
                    model : 'ADV_BDC_categories',
                    key : 'id'
                }
            },
            idProduit : {
                type : DataTypes.INTEGER,
                references : {
                    model : 'ADV_BDC_produits',
                    key : 'id'
                }
            }
        }, 
        {
            name : {
                singular : 'ADV_BDC_produitsCategorie',
                plural : 'ADV_BDC_produitsCategories'
            },
            tableName : 'ADV_BDC_produitsCategories'
        }
    )

    ADV_BDC_produitsCategorie.associate = models => {
        
    }

    return ADV_BDC_produitsCategorie
}
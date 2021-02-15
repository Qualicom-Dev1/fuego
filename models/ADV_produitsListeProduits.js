module.exports = (sequelize, DataTypes) => {
    const ADV_produitListeProduits = sequelize.define('ADV_produitListeProduits', 
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
                    model : 'ADV_produits',
                    key : 'id'
                }
            },
            idProduitListe : {
                type : DataTypes.INTEGER,
                references : {
                    model : 'ADV_produits',
                    key : 'id'
                }
            }
        }, 
        {
            name : {
                singular : 'ADV_produitListeProduits',
                plural : 'ADV_produitsListeProduits'
            },
            tableName : 'ADV_produitsListeProduits'
        }
    )

    ADV_produitListeProduits.associate = models => {
        // ADV_produitListeProduits.belongsTo(models.ADV_produit, { /*as : 'Parent',*/ onDelete: 'CASCADE' })
        // ADV_produitListeProduits.belongsTo(models.ADV_produit, { /*as : 'Sibling',*/ onDelete: 'CASCADE' })
    }

    return ADV_produitListeProduits
}
module.exports = (sequelize, DataTypes) => {
    const Prestation = sequelize.define('Prestation', 
        {
            idClient : {
                type : DataTypes.INTEGER,
                allowNull : false,
                validate : {
                    notNull : {
                        msg : "Un client doit être lié à la prestation."
                    }
                }
            },
            idPole : {
                type : DataTypes.INTEGER,
                allowNull : false,
                validate : {
                    notNull : {
                        msg : "Un pôle doit être lié à la prestation."
                    }
                }
            }
        }, 
        {
            
        }
    )

    Prestation.associate = models => {
        Prestation.belongsTo(models.ClientBusiness, { foreignKey : 'idClient' })
        Prestation.belongsTo(models.Pole, { foreignKey : 'idPole' })
        Prestation.hasMany(models.Devis, { foreignKey : 'idPrestation' })
        Prestation.hasMany(models.Facture, { foreignKey : 'idPrestation' })
        Prestation.belongsToMany(models.ProduitBusiness, { through : 'ProduitBusiness_Prestation', foreignKey : 'idPrestation' })
        Prestation.hasOne(models.RDVsFacturation_Prestation, { foreignKey : 'idPrestation' })
    }

    return Prestation
}
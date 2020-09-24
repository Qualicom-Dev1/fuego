module.exports = (sequelize, DataTypes) => {
    const TypePaiement = sequelize.define('TypePaiement', 
        {
            nom : {
                type : DataTypes.SRING(256),
                allowNull : false,
                validate : {
                    len : {
                        args : [1, 256],
                        msg : 'Le nom du type de paiement est limité à 256 caractères.'
                    },
                    notNull : {
                        msg : "Le nom du type de paiement doit être indiqué."
                    }
                }
            }
        }, 
        {
            name : {
                singular : 'TypePaiement',
                plural : 'TypesPaiement'
            }
        }
    )

    TypePaiement.associate = models => {
        TypePaiement.hasMany(models.Facture, { foreignKey : 'idTypePaiement' })
    }

    return TypePaiement
}
module.exports = (sequelize, DataTypes) => {
    const Pole = sequelize.define('Pole', 
        {
            nom : {
                type : DataTypes.SRING(256),
                allowNull : false,
                validate : {
                    len : {
                        args : [1, 256],
                        msg : 'Le nom du pôle est limité à 256 caractères.'
                    },
                    notNull : {
                        msg : "Le nom du pôle doit être indiqué."
                    }
                }
            }
        }, 
        {
            
        }
    )

    Pole.associate = models => {

    }

    return Pole
}
module.exports = (sequelize, DataTypes) => {
    const Compteur = sequelize.define('Compteur', {
        nom : {
			type: DataTypes.STRING,
			allowNull: false,
			primaryKey: true,
			unique : true
		},
		valeur : {
			type: DataTypes.INTEGER(11),
            allowNull : false,
            defaultValue : 0
		}
    }, {
        
	})
    Compteur.associate = models => {
        
    }

    return Compteur
}
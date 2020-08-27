module.exports = (sequelize, DataTypes) => {
    const Zone = sequelize.define('Zone', {
        nom : DataTypes.STRING,
        deps : DataTypes.STRING(300),
        affichage_titre : DataTypes.BOOLEAN
    }, {})

    Zone.associate = models => {

    }

    return Zone
}
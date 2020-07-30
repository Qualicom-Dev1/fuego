module.exports = (sequelize, DataTypes) => {
    const Zone = sequelize.define('Zone', {
        nom : DataTypes.STRING,
        deps : DataTypes.STRING(300)
    }, {})

    Zone.associate = models => {

    }

    return Zone
}
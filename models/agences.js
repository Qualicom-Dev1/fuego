module.exports = (sequelize, DataTypes) => {
    const Agence = sequelize.define('Agence', {
        idSousZone : DataTypes.INTEGER,
        nom : DataTypes.STRING,
        deps : DataTypes.STRING(300)
    }, {})

    Agence.associate = models => {
        Agence.belongsTo(models.SousZone, { foreignKey : 'idSousZone' })
    }

    return Agence
}
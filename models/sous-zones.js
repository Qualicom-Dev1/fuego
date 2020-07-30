module.exports = (sequelize, DataTypes) => {
    const SousZone = sequelize.define('SousZone', {
        idZone : DataTypes.INTEGER,
        nom : DataTypes.STRING,
        deps : DataTypes.STRING(300)
    }, {})

    SousZone.associate = models => {
        SousZone.belongsTo(models.Zone, { foreignKey : 'idZone' })
    }

    return SousZone
}
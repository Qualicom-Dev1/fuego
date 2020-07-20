module.exports = (sequelize, DataTypes) => {
    const AppartenanceAgence = sequelize.define('AppartenanceAgence', {
        idVendeur : {
            type : DataTypes.INTEGER,
            unique : true
        },
        idAgence : DataTypes.INTEGER,        
        deps : DataTypes.STRING(300)
    }, {})

    AppartenanceAgence.associate = models => {
        AppartenanceAgence.belongsTo(models.User, { foreignKey : 'idVendeur' })
        AppartenanceAgence.belongsTo(models.Agence, { foreignKey : 'idAgence' })
    }

    return AppartenanceAgence
}
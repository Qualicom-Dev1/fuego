module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        idStructure: DataTypes.INTEGER,
        texte : DataTypes.STRING(500),
    }, {})

    Message.associate = models => {
        Message.belongsTo(models.Structure, { foreignKey: 'idStructure' })
    }

    return Message
}
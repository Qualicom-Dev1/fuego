module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        texte : DataTypes.STRING(500),
    }, {})

    Message.associate = models => {

    }

    return Message
}
module.exports = (sequelize, DataTypes) => {
    const ADV_BDC_client_infoTechniques = sequelize.define('ADV_BDC_client_infoTechniques', 
        {
            typeInstallationElectrique : {
                type : DataTypes.ENUM('monophasée', 'triphasée'),
                allowNull : false
            },
            puissanceKW : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : true,
                defaultValue : null
            },
            puissanceA : {
                type : DataTypes.DECIMAL(10,2),
                allowNull : true,
                defaultValue : null
            },
            anneeConstructionMaison : {
                type : DataTypes.INTEGER(4),
                allowNull : true,
                defaultValue : null
            },
            dureeSupposeeConstructionMaison : {
                type : DataTypes.INTEGER(3),
                allowNull : true,
                defaultValue : null
            },
            dureeAcquisitionMaison : {
                type : DataTypes.INTEGER(3),
                allowNull : true,
                defaultValue : null
            },
            typeResidence : {
                type : DataTypes.ENUM('principale', 'secondaire'),
                allowNull : true,
                defaultValue : null
            },
            superficie : {
                type : DataTypes.NUMBER,
                allowNull : true,
                defaultValue : null
            }
        }, 
        {
            name : {
                singular : 'ADV_BDC_client_infoTechniques',
                plural : 'ADV_BDC_clients_infoTechniques'
            },
            tableName : 'ADV_BDC_clients_infoTechniques'
        }
    )

    ADV_BDC_client_infoTechniques.associate = models => {

    }

    return ADV_BDC_client_infoTechniques
}
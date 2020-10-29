const moment = require('moment')

module.exports = (sequelize, DataTypes) => {
    const RDVsFacturation_Prestation = sequelize.define('RDVsFacturation_Prestation', 
        {
            idPrestation : {
                type : DataTypes.INTEGER,
                primaryKey: true,
                unique : true,
                allowNull : false,
                validate : {
                    notNull : {
                        msg : "La prestation liée aux RDVs doit être renseignée."
                    }
                }
            },
            listeIdsRDVs : {
                type : DataTypes.STRING(10000),
                allowNull : false,
                validate : {
                    notNull : {
                        msg : "La liste de RDVs pour la prestation ne peut pas être nulle."
                    },
                    len : {
                        args : [1, 10000],
                        msg : "La liste de RDVs pour la prestation doit contenir au moins un RDV."
                    }
                }
            },
            dateDebut : {
                type : DataTypes.DATE,
                allowNull : false,
                validate : {
                    notNull : {
                        msg : "La date de début doit être renseignée."
                    }
                },
                get() {
                    return moment(this.getDataValue('dateDebut')).format('DD/MM/YYYY')
                },
                set(value) {
                    this.setDataValue('dateDebut', moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD'))
                }
            },
            dateFin : {
                type : DataTypes.DATE,
                allowNull : false,
                validate : {
                    notNull : {
                        msg : "La date de fin doit être renseignée."
                    }
                },
                get() {
                    return moment(this.getDataValue('dateFin')).format('DD/MM/YYYY')
                },
                set(value) {
                    this.setDataValue('dateFin', moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD'))
                }
            }
        }, 
        {
            name : {
                singular : 'RDVsFacturation_Prestation',
                plural : 'RDVsFacturation_Prestations'
            },
            tableName : 'RDVsFacturation_Prestation'
        }
    )

    RDVsFacturation_Prestation.associate = models => {
        RDVsFacturation_Prestation.belongsTo(models.Prestation, { foreignKey : 'idPrestation' })
    }

    return RDVsFacturation_Prestation
}
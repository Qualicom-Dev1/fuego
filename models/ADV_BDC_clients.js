module.exports = (sequelize, DataTypes) => {
    const ADV_BDC_client = sequelize.define('ADV_BDC_client', 
        {
            refClient : {
                type : DataTypes.NUMBER,
                allowNull : false
            },
            nom : {
                type : DataTypes.STRING(256),
                allowNull : false,
                validate : {
                    len : {
                        args : [1, 256],
                        msg : 'Le nom est limité à 256 caractères.'
                    },
                    notNull : {
                        msg : "Le nom du client doit être indiqué."
                    }
                }
            },
            adresse : {
                type: DataTypes.STRING(500),
                allowNull: true,
                defaultValue: '',
                validate : {
                    len : {
                        args : [0, 500],
                        msg : 'L\'adresse est limité à 500 caractères.'
                    }
                }
            },
            adresseComplement1 : {
                type: DataTypes.STRING(500),
                allowNull: true,
                defaultValue: '',
                validate : {
                    len : {
                        args : [0, 500],
                        msg : 'Le complement d\'adresse est 1 limité à 500 caractères.'
                    }
                }
            },
            adresseComplement2 : {
                type: DataTypes.STRING(500),
                allowNull: true,
                defaultValue: '',
                validate : {
                    len : {
                        args : [0, 500],
                        msg : 'Le complément d\'adresse 2 est limité à 500 caractères.'
                    }
                }
            },
            cp : {
                type: DataTypes.STRING(5),
                allowNull: false,
                validate : {
                    isNumeric : {
                        msg : 'Le code postal doit être composé de 5 chiffres.'
                    },
                    len : {
                        args : [5, 5],
                        msg : 'Le code postal doit être composé de 5 chiffres.'
                    }
                }
            },
            ville : {
                type: DataTypes.STRING(256),
                allowNull: false,
                validate : {
                    len : {
                        args : [2, 256],
                        msg : 'La ville est limité à 256 caractères.'
                    }
                }
            },
            email : {
                type: DataTypes.STRING(320),
                allowNull: false,
                validate : {
                    isEmail: {
                        msg : 'L\'adresse e-mail est incorrecte.'
                    },
                    len : {
                        args : [6, 320],
                        msg : 'L\'adresse e-mail est incorrecte.'
                    }
                }
            },
            telephone : {
                type: DataTypes.STRING(10),
                allowNull: false,
                validate : {
                    isPhoneNumber : value => {
                        if(value !== null && value !== '' && !value.match(/^0[6-7][0-9]{8}$/g)) {
                            throw new Error('Numéro de téléphone invalide.')
                        }
                    }
                }
            },
        }, 
        {
            name : {
                singular : 'ADV_BDC_client',
                plural : 'ADV_BDC_clients'
            },
            tableName : 'ADV_BDC_clients'
        }
    )

    ADV_BDC_client.associate = models => {
        ADV_BDC_client.belongsTo(models.Client, { foreignKey: 'refClient' })
        // ADV_BDC_client.hasMany(models.Prestation, { foreignKey : 'idClient' })
    }

    return ADV_BDC_client
}
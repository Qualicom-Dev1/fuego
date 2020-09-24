module.exports = (sequelize, DataTypes) => {
    const ClientBusiness = sequelize.define('ClientBusiness', 
        {
            nom : {
                type : DataTypes.STRING(256),
                allowNull : false,
                validate : {
                    len : {
                        args : [1, 256],
                        msg : 'Le nom est limité à 256 caractères.'
                    },
                    notNull : {
                        msg : "Le nom du client et / ou de la société doit être indiqué."
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
                allowNull: true,
                defaultValue: '',
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
                allowNull: true,
                defaultValue: '',
                validate : {
                    len : {
                        args : [0, 256],
                        msg : 'La ville est limité à 256 caractères.'
                    }
                }
            },
            email : {
                type: DataTypes.STRING(320),
                allowNull: true,
                defaultValue: '',
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
                allowNull: true,
                defaultValue: '',
                validate : {
                    isPhoneNumber : value => {
                        if(!value.match(/^[0-9]{10}$/g)) {
                            throw new Error('Numéro de téléphone invalide.')
                        }
                    }
                }
            },
            numeroTVA : {
                type : DataTypes.STRING(13),
                allowNull : true,
                defaultValue : '',
                validate : {
                    len : {
                        args : [13, 13],
                        msg : 'Le numéro de TVA doit être un code à 13 caractères.'
                    },
                    is : {
                        args : /^FR[0-9]{2}[0-9]{9}$/ig,
                        msg : "Le numéro TVA doit être composé des lettres FR, suivie d'une clé à 2 chiffres et du numéro SIREN à 9 chiffres."
                    }
                }
            }
        }, 
        {
            name : {
                singular : 'ClientBusiness',
                plural : 'ClientsBusiness'
            },
            tableName : 'ClientsBusiness'
        }
    )

    ClientBusiness.associate = models => {
        ClientBusiness.hasMany(models.Prestation, { foreignKey : 'idClient' })
    }

    return ClientBusiness
}
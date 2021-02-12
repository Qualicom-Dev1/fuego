const express = require('express')
const router = express.Router()
const models = global.db
const { ADV_categorie, Structure, ADV_produit } = models
const sequelize = require('sequelize')
const Op = sequelize.Op
const errorHandler = require('../utils/errorHandler')
const isSet = require('../utils/isSet')
const validations = require('../utils/validations')

// fonction de contrôle pour la création ou la modification d'une catégorie
async function checkCategorie(categorie, user) {
    if(!isSet(categorie)) throw "Une catégorie doit être transmise."

    // vérifie le nom et la description
    validations.validationString(categorie.nom, "Le nom de la catégorie")
    if(isSet(categorie.description)) validations.validationString(categorie.description, "La description de la catégorie", "e")

    // vérifie la structure
    if(!isSet(categorie.idStructure)) throw "La catégorie doit être liée à une structure."
    const structure = await Structure.findOne({
        include : {
            model : models.Type,
            where : {
                nom : 'Agence'
            }
        },
        where : {
            id : categorie.idStructure
        }
    })
    if(structure === null) throw "Aucune structure correspondante."
    if(!user.Structures.some(userStructure => userStructure.id === structure.id)) throw "Vous ne pouvez pas créer de catégorie pour une structure à laquelle vous n'appartenez pas."    

    // vérification que le nom ne soit pas déjà utilisé
    const checkNom = await ADV_categorie.findOne({
        where : {
            nom : categorie.nom,
            idStructure : categorie.idStructure
        }
    })
    if(checkNom !== null && (!categorie.id || categorie.id !== checkNom.id)) throw "Le nom est déjà utilisé par une autre catégorie."

}

router
// renvoie toutes les catégories
.get('/', async (req, res) => {
    let infos = undefined
    let categories = undefined

    try {
        const listeIdsStructures = req.session.client.Structures.map(structure => structure.id)

        categories = await ADV_categorie.findAll({
            attributes : [
                'id', 'nom', 'description', 'idStructure',
                // [sequelize.fn('COUNT', sequelize.col('ADV_produits.id')), 'nbProduits']
            ],
            include : [
                {
                    model : Structure,
                    attributes : ['id', 'nom']
                },
                // {
                //     model : ADV_produit,
                //     attributes : []
                // }
            ],
            where : {
                idStructure : {
                    [Op.in] : listeIdsStructures
                }
            },
            order : [['nom', 'ASC']]
        })
        if(categories === null) throw "Une erreur est survenue lors de la récupération des catégories."

        // avec la fonction COUNT s'il n'y a pas de catégorie, une catégorie sera tout de même retournée avec des valeurs à null et nbProduits à 0 d'où la branche droite de la vérification
        if(categories.length === 0 || (categories.length === 1 && categories[0].id === null)) {
            categories = undefined
            infos = errorHandler(undefined, "Aucune catégorie disponible.")
        }
        else {
            // récupération du nombre de produits par catégorie
            for(let i = 0; i < categories.length; i++) {
                const nbProduits = (await categories[i].getADV_produits()).length
                categories[i] = JSON.parse(JSON.stringify(categories[i]))
                categories[i].nbProduits = nbProduits
            }
        }
    }
    catch(error) {
        categories = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        categories
    })
})
// récupère une catégorie
.get('/:IdCategorie', async (req, res) => {
    let infos = undefined
    let categorie = undefined

    try {
        const IdCategorie = req.params.IdCategorie    

        // vérifie l'existence de la catégorie
        categorie = await ADV_categorie.findOne({
            include : {
                model : Structure,
                attributes : ['id', 'nom']
            },
            where : {
                id : IdCategorie,
                idStructure : {
                    [Op.in] : req.session.client.Structures.map(structure => structure.id)
                }
            }
        })
        if(categorie === null) throw "Aucune catégorie correspondante."        
    }
    catch(error) {
        categorie = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        categorie
    })
})
// crée une catégorie
.post('/', async (req, res) => {
    let infos = undefined
    let categorie = undefined

    try {
        const categorieSent = req.body

        await checkCategorie(categorieSent, req.session.client)

        categorie = await ADV_categorie.create({
            nom : categorieSent.nom,
            description : isSet(categorieSent.description) ? categorieSent.description : '',
            idStructure : categorieSent.idStructure
        })
        if(categorie === null) throw "Une erreur s'est produite lors de la création de la catégorie."

        infos = errorHandler(undefined, "La catégorie a bien été créée.")
    }
    catch(error) {
        categorie = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        categorie
    })
})
// modifie une catégorie
.patch('/:IdCategorie', async (req, res) => {
    let infos = undefined
    let categorie = undefined

    try {
        const IdCategorie = req.params.IdCategorie
        const categorieSent = req.body        

        // vérifie l'existence de la catégorie
        categorie = await ADV_categorie.findOne({
            include : {
                model : Structure,
                attributes : ['id', 'nom']
            },
            where : {
                id : IdCategorie,
                idStructure : {
                    [Op.in] : req.session.client.Structures.map(structure => structure.id)
                }
            }
        })
        if(categorie === null) throw "Aucune catégorie correspondante."

        categorieSent.idStructure = categorie.idStructure
        await checkCategorie(categorieSent, req.session.client)

        categorie.nom = categorieSent.nom
        categorie.description = isSet(categorieSent.description) ? categorieSent.description : ''
        await categorie.save()

        infos = errorHandler(undefined, "La catégorie a bien été modifiée.")
    }
    catch(error) {
        categorie = undefined
        infos = errorHandler(error)
    }

    res.send({
        infos,
        categorie
    })
})
// retire une catégorie
.delete('/:IdCategorie', async (req, res) => {
    infos = undefined

    try {
        const IdCategorie = req.params.IdCategorie

        // vérifie l'existence de la catégorie
        categorie = await ADV_categorie.findOne({
            where : {
                id : IdCategorie,
                idStructure : {
                    [Op.in] : req.session.client.Structures.map(structure => structure.id)
                }
            }
        })
        if(categorie === null) throw "Aucune catégorie correspondante."

        await categorie.destroy()

        infos = errorHandler(undefined, "La catégorie à bien été retirée.")
    }
    catch(error) {
        infos = errorHandler(error)
    }

    res.send({
        infos
    })
})


module.exports = router
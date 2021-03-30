const { UniversignClient, BasicAuthConfig, DocSignatureField, SignatureField, TransactionDocument, TransactionRequest, TransactionRequestConstants, TransactionSigner, TransactionSignerConstants } = require('@digitregroup/universign-client')
const { CertificateType, Language, HandwrittenSignatureMode, ChainingMode } = TransactionRequestConstants
// const { Role } = TransactionSignerConstants
const { v4 : uuidv4 } = require('uuid')
const isSet = require('./isSet')

class UniversignAPI {
    _urlDev = 'https://sign.test.cryptolog.com/sign/rpc/'
    _urlProd = 'https://ws.universign.eu/sign/rpc/'

    _listeErrorCodes = [
        {
            code : 73002,
            message : 'An error occurred when signing the PDF document.'
        },
        {
            code : 73004,
            message : 'An error occurred when retrieving a stored private key.'
        },
        {
            code : 73010,
            message : 'The login and/or password are invalid.'
        },
        {
            code : 73011,
            message : 'The requesting user doesn’t have a valid signing account or its signing account is inactive.'
        },
        {
            code : 73013,
            message : 'The requesting user doesn’t have a valid signing account or its signing account is inactive.'
        },
        {
            code : 73014,
            message : 'When retrieving the document, the transaction id is missing or wrong.'
        },
        {
            code : 73020,
            message : 'Malformed request. Typically, an invalid value has been set, the TransactionRequest misses some mandatory elements or has some incompatible elements. The message attached to the RPC fault contain more accurate information.'
        },
        {
            code : 73025,
            message : 'The used transaction id or custom id is invalid.'
        },
        {
            code : 73027,
            message : 'Requesting an action on a transaction which status doesn’t allow this action (e.g requesting the documents of an unfinished transaction).'
        },
        {
            code : 73040,
            message : 'Internal server error.'
        },
        {
            code : 73070,
            message : 'The requested document is being retrieved asynchronously from archival, it may take few hours. A further request will return the document.'
        }
    ]

    ROLE = TransactionSignerConstants.Role

    constructor(login, passwd) {
        this._universignClient = new UniversignClient({
            url : this._urlDev,
            basicAuth : new BasicAuthConfig({
                user : login,
                pass : passwd
            }),
            https : true
        })
    }
    
    _getError(errorCode) {
        const generalError = 'Une erreur inconnue est survenue.'
        const error = this._listeErrorCodes.find(error => error.code === Number(errorCode))
    
        return error ? error.message : generalError
    }
    
    // gère l'envoie des requêtes et lève une erreur lorsqu'il y en a une
    async requestSender(request) {
        const response = await request
        if(typeof response === 'object') return response
        else if(typeof response === 'number' && response !== 0) throw this._getError(response)
    }

    // retourne un objet de type TransactionInfo
    async getTransactionInfo(transactionId) {
        return this.requestSender(this._universignClient.call('requester.getTransactionInfo', [transactionId]))
    }

    // relance une transaction, si un problème est survenue le message d'erreur correspondant est renvoyé
    async relaunchTransaction(transactionId) {
        return this.requestSender(this._universignClient.call('requester.relaunchTransaction', [transactionId]))
    }

    // annule une transaction en cours
    async cancelTransaction(transactionId) {
        return this.requestSender(this._universignClient.call('requester.cancelTransaction', [transactionId]))
    }

    // crée un signataire pour une transaction
    createSigner(prenom, nom, email, telephone, role = this.ROLE.SIGNER) {   
        if(role === this.ROLE.SIGNER && isSet(telephone)) {
            // mise en forme du numéro de téléphone comme spécifié dans la documentation
            if((telephone.startsWith('06') || telephone.startsWith('07')) && telephone.length === 10) telephone = `33${telephone.substr(1, telephone.length)}`
            else throw 'Le numéro de mobile du signataire doit être de la forme 06XXXXXXXX ou 07XXXXXXXX.'
        }
        
        return new TransactionSigner({
            firstname : prenom,
            lastname : nom,
            emailAddress : email,
            phoneNum : telephone,
            language : Language.FRENCH,
            // role,
            autoSendAgreements : true
        })
    }

    // crée un TransactionDocument d'un document pdf pour une transaction
    createDocument(nomFichier, rawPDF, signatures, boxsAcceptation) {
        const champsSignatures = signatures.map((signature, index) => {
            new DocSignatureField(
                {
                    signerIndex : index,
                    // ?? voir si le pattern doit être défini avec universign pour chaque société
                    patternName : 'default',
                    // label : 'Signature du client : ',               
                },
                new SignatureField({
                    // dernière page
                    page : signature.page,
                    x : signature.x,
                    y : signature.y
                })
            )
        })

        return new TransactionDocument({
            id : uuidv4(),
            documentType : 'pdf',
            // byte[] du pdf
            content : rawPDF,
            fileName : nomFichier,
            signatureFields : champsSignatures,
            checkBoxTexts : boxsAcceptation
        })
    }

    // crée une nouvelle collecte avec le/les documents à signer aisni que le/les signataires
    // description correspond au nom qui sera donné à la collecte
    async createTransaction(listeSignataires, listeDocuments, description, customId = undefined) {
        return this.requestSender(this._universignClient.call('requester.requestTransaction', 
            [
                new TransactionRequest({
                    customId,
                    signers : listeSignataires,
                    documents : listeDocuments,
                    mustContactFirstSigner : false,
                    finalDocSent : true,
                    // false si c'est le vendeur, qui le recevra déjà avec finalDocSent; true si cest le compte admin qui est utilisé et le vendeur un simple signataire
                    finalDocRequesterSent : false,
                    // ex : Contrat installation chauffage de Monsieur Pierre
                    description : description,
                    certificateType : CertificateType.SIMPLE,
                    language : Language.FRENCH,
                    // signature manuscrite dans tous les cas
                    handwrittenSignatureMode : HandwrittenSignatureMode.DISABLED,
                    // les signataire sont physiquement au même endroit
                    chainingMode : ChainingMode.WEB,
                    // ?? voir comment le configurer ou s'il faut que ça soit différent et surchargé dans TransactionSigner
                    redirectPolicy : 'quick'
                    // voir pour les redirections...
                })
            ]
        ))
    }

    /**
     * Crée la transaction complète / collecte de documents pour un bon de commande
     * @param {Object[]} documents - Liste des documents à signer avec le nom du document, le contenu du document, l'emplacement de chaque signature (page, x, y) et les textes à accepter avant de signer
     * @param {string} documents[].nom - Le nom du document tel qu'il apparaitra
     * @param {byte[]} documents[].rawFile - Le contenu du document PDF
     * @param {Object[]} documents[].signatures - Liste des dispositions de signatures pour le document, doit avoir la même taille que la liste des signataires
     * @param {number} documents[].signatures[].page - Le numéro de la page où doit figurer la signature, -1 pour la dernière page
     * @param {number} documents[].signatures[].x - La valeur sur l'axe x
     * @param {number} documents[].signature[].y - La valeur sur l'axe y
     * @param {string[]} documents[].acceptations - Liste des conditions d'acceptation du document
     * @param {Object[]} signataires - Liste des sigantaires dans l'ordre dans lequel ils doivent signer avec nom, prenom, email, port
     * @param {string} signataires[].nom - Nom du sigantaire
     * @param {string} signataires[].prenom - Prénom du signataire
     * @param {string} signataires[].email - Adresse email du signataire
     * @param {string} signataires[].port - Numéro de téléphone portable du signataire
     * @param {string} description - Description de la collecte de documents (ex : Bon de commande client : x x, le date du jour)
     */
    async createTransactionBDC(customId, documents = [], signataires = [], description) {
        if(documents.length === 0) throw "Au moins un document doit être transmis pour siganture."
        if(signataires.length < 2) throw "Au moins deux signataires (le technicien et le client) doivent être transmis pour signature."

        const listeDocuments = []
        const listeSignataires = []

        // vérifications de la liste des documents
        for(const document of documents) {
            if(!isSet(document.nom)) throw "Le nom du document à signer doit être transmis."
            if(!isSet(document.rawFile)) throw "Le document à signer doit être transmis."
            if(!isSet(document.signatures)) throw "L'emplacement des signatures dans le document à signer doit être transmis."
            if(document.signatures.length !== signataires.length) throw "Le nombre de signatures par document doit être identique au nombe de signataires."
            for(const signature of document.signatures) {
                if(!isSet(signature.page)) throw "La page de la signature doit être renseignée."
                if(!isSet(signature.x) || !isSet(signature.y)) throw "L'emplacement de la signature dans le document doit être renseigné."
            }
            if(!isSet(document.acceptations) || typeof document.acceptations !== 'object' || document.acceptations.length < 1) throw "Au moins un champ d'acceptation du document doit être transmis."

            listeDocuments.push(this.createDocument(document.nom, document.rawFile, document.signatures, document.acceptations))
        }

        // vérification des signataires
        for(const signataire of signataires) {
            if(!isSet(signataire.nom) || !isSet(signataire.prenom)) throw "Le nom et prénom de chaque signataire doit être transmis pour signature."
            if(!isSet(signataire.email)) throw "L'adresse email de chaque signataire doit être transmise."
            // FIXME: vérifier la présence du numéro de téléphone?

            listeSignataires.push(this.createSigner(signataire.prenom, signataire.nom, signataire.email, signataire.port))
        }

        return this.createTransaction(listeSignataires, listeDocuments, description, customId)        
    }

    // récupère les documents signés dans le cas où la collecte est complétée avec succès
    async getSignedDocuments(transactionId) {
        return this.requestSender(this._universignClient.call('requester.getDocuments', [transactionId]))
    }

    /**
     * récupère les documents signés dans le cas où la collecte est complétée avec succès
     * @param {string} customId - Identifiant hors universign permettant de retrouver la transaction
     * @returns {TransactionDocument} - retourne un tableau d'objets TransactionDocument[] avec les documents de la collecte
     */
    async getSignedDocumentsByCustomId(customId) {
        return this.requestSender(this._universignClient.call('requester.getDocuments', [customId]))
    }

    // récupère les informations d'une collecte (status, currentSigner, creationDate, description, initiatorInfo, eachField[signature manuelle ou non], customId, transactionId)
    async getTransactionInfo(transactionId) {
        return this.requestSender(this._universignClient.call('requester.getTransactionInfo', [transactionId]))
    }

    /**
     * 
     * @param {string} customId - Identifiant hors universign permettant de retrouver la transaction
     * @returns {TransactionInfo} - retourne un objet TransactionInfo avec les informations d'une collecte (status, currentSigner, creationDate, description, initiatorInfo, eachField[signature manuelle ou non], customId, transactionId)
     */
    async getTransactionInfoByCustomId(customId) {
        return this.requestSender(this._universignClient.call('requester.getTransactionInfoByCustomId', [customId]))
    }
}

module.exports = UniversignAPI
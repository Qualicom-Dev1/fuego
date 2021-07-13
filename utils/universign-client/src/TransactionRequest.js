const Joi = require('@hapi/joi');
const createJoiErrorHandler = require('./handle-joi-error');
const BaseObject = require('./BaseObject');
const {TransactionDocument} = require('./TransactionDocument');
const {TransactionSigner} = require('./TransactionSigner');

/**
 * Indicates which certificate type will be used to perform the signature and therefore which type of signature will be performed by this signer
 */
const CertificateType = {
  LOCAL: 'local',

  /**
   * Allows signers to perform a certified signature.
   */
  CERTIFIED: 'certified',

  /**
   * Allows signers to perform an advanced signature which requires the same options as a certified signature.
   */
  ADVANCED: 'advanced',

  /**
   * (default) Allows signers to perform a simple signature.
   */
  SIMPLE: 'simple'
};

/**
 * The interface language for a transaction.
 */
const Language = {
  BULGARIAN: 'bg',
  CATALAN: 'ca',
  GERMAN: 'de',
  ENGLISH: 'en',
  SPANISH: 'es',
  FRENCH: 'fr',
  ITALIAN: 'it',
  DUTCH: 'nl',
  POLISH: 'pl',
  PORTUGUESE: 'pt',
  ROMANIAN: 'ro'
};

/**
 * The mode to enable the handwritten signature.
 */
const HandwrittenSignatureMode = {
  /**
   * disables the hand-written signature
   */
  DISABLED: 0,

  /**
   * enables the hand-written signature
   */
  ENABLED: 1,

  /**
   * enables the hand-written signature if only it is a touch interface
   */
  ENABLED_FOR_TOUCH_INTERFACE_ONLY: 2
};

/**
 * This option indicates how the signers are chained during the signing process.
 */
const ChainingMode = {
  /**
   * No invitation email is sent in this mode. Each signer is redirected to the successURL after signing. It is up to the requester to contact each of the signers.
   */
  NONE: 'none',

  /**
   * The default value. The signers receive the invitation email (except for the first one, see mustContactFirstSigner) and are redirected to the successURL.
   */
  EMAIL: 'email',

  /**
   * Enables the linked signature mode. In this mode, all signers are physically at the same place. After a signer completed its signature, he will be redirected to the next signer’s signature page instead of being returned to the
   */
  WEB: 'web'
};

/**
 * A TransactionRequest describes and contains options for a document signer
 */
class TransactionRequest extends BaseObject {

  /**
   *
   * @param {string?} profile The name of the signature profile to use.
   * @param {string?} customId A requester-set unique id that can be used to identify this transaction.
   * @param {[TransactionSigner]} signers The signers that will have to take part to the transaction. Must contain at least one element.
   * @param {[TransactionDocument]} documents The documents to be signed. Must contain at least one element. The size limit of each document is set to 10Mo.
   * @param {boolean?} mustContactFirstSigner If set to True, the first signer will receive an invitation to sign the document(s) by e-mail as soon as the transaction is requested. False by default.
   * @param {boolean?} finalDocSent Tells whether each signer must receive the signed documents by e-mail when the transaction is completed. False by default
   * @param {boolean?} finalDocRequesterSent Tells whether the requester must receive the signed documents via e-mail when the transaction is completed. False by default.
   * @param {boolean?} finalDocObserverSent Tells whether the observers must receive the signed documents via e-mail when the transaction is completed. It takes the finalDocSent value by default.
   * @param {string?} description Description or title of the signature.
   * @param {string?} certificateType Indicates which certificate type will be used to perform the signature and therefore which type of signature will be performed by this signer. (@see CertificateType)
   * @param {string?} language The interface language for this transaction.
   * @param {number} handwrittenSignatureMode The mode to enable the handwritten signature. There are three modes:
   * @param {string} chainingMode This option indicates how the signers are chained during the signing process.
   * @param {[{string}]} finalDocCCeMails   This option allows to send a copy of the final signed documents to a list of email addresses.
   *                                        This copy is send as cc for every final signed documents email addressed to a signer.
   *                                        For this option to be taken into account, the option finalDocSent must be sent to True.
   * @param {boolean} twoStepsRegistration  This option allows registration of signers via a two steps registration process.
   *                                        When activated, the RegistrationRequest bean becomes mandatory for each of the unregistered TransactionSigners, the certicateType
   *                                        must be set to advanced, the phoneNumber and the birthDate must be set.
   *                                        Default value is False.
   */
  constructor({
    profile,
    customId,
    signers,
    documents,
    mustContactFirstSigner,
    finalDocSent,
    finalDocRequesterSent,
    finalDocObserverSent,
    description,
    certificateType,
    language,
    handwrittenSignatureMode,
    chainingMode,
    finalDocCCeMails,
    twoStepsRegistration,
  }) {
    // Pre-validation

    // Creates an error handler
    const errorHandler = createJoiErrorHandler('TransactionRequest');

    // Define the option object
    const options = {
      profile,
      customId,
      signers,
      documents,
      mustContactFirstSigner,
      finalDocSent,
      finalDocRequesterSent,
      finalDocObserverSent,
      description,
      certificateType,
      language,
      handwrittenSignatureMode,
      chainingMode,
      finalDocCCeMails,
      twoStepsRegistration,
    };

    // Define the options validation schema
    const validationSchema = Joi.object().keys({
      profile: Joi.string().optional(),
      customId: Joi.string().optional(),
      signers: Joi.array().items(Joi.object().type(TransactionSigner)
        .required())
        .required(),
      documents: Joi.array().items(Joi.object().type(TransactionDocument)
        .required())
        .required(),
      mustContactFirstSigner: Joi.boolean().optional(),
      finalDocSent: Joi.boolean().optional(),
      finalDocRequesterSent: Joi.boolean().optional(),
      finalDocObserverSent: Joi.boolean().optional(),
      description: Joi.string().optional(),
      certificateType: Joi.string().valid(Object.values(CertificateType))
        .optional(),
      language: Joi.string().valid(Object.values(Language))
        .optional(),
      handwrittenSignatureMode: Joi.number().integer()
        .valid(Object.values(HandwrittenSignatureMode))
        .optional(),
      chainingMode: Joi.string().valid(Object.values(ChainingMode))
        .optional(),
      finalDocCCeMails: Joi.array().items(Joi.string())
        .optional(),
      twoStepsRegistration: Joi.boolean().optional(),
    })
      .required();

    // Validate and set class attributes
    super(options, validationSchema, errorHandler);
  }
}

module.exports.TransactionRequest = TransactionRequest;
module.exports.CertificateType = CertificateType;
module.exports.Language = Language;
module.exports.HandwrittenSignatureMode = HandwrittenSignatureMode;
module.exports.ChainingMode = ChainingMode;

const Joi = require('@hapi/joi');
const createJoiErrorHandler = require('./handle-joi-error');
const BaseObject = require('./BaseObject');

/**
 * Indicates which certificate type will be used to perform the signature and therefore which type of signature will be performed by this signer
 * @type {{CERTIFIED: string, LOCAL: string, SIMPLE: string, ADVANCED: string}}
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
 * @type {{POLISH: string, BULGARIAN: string, ROMANIAN: string, CATALAN: string, ENGLISH: string, SPANISH: string, ITALIAN: string, GERMAN: string, PORTUGUESE: string, FRENCH: string, DUTCH: string}}
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
 * The role of this transaction actor.
 * @type {{SIGNER: string, OBSERVER: string}}
 */
const Role = {
  // (default) This actor is a signer and he will be able to view the documents and sign them.
  SIGNER: 'Signer',

  // This actor is an observer and he will be able only to view the documents.
  OBSERVER: 'Observer'
};

/**
 * A TransactionSigner describes and contains options for a document signer
 */
class TransactionSigner extends BaseObject {

  /**
   *
   * @param {string}  emailAddress This signer’s e-mail address.
   * @param {string?} firstname This signer’s firstname. Note that this field is mandatory for a self-signed certificate.
   * @param {string?} lastname This signer’s lastname. Note that this field is mandatory for a self-signed certificate.
   * @param {string?} organization This signer’s organization.
   * @param {string?} profile The name of the signer profile to use for some customizations. It is set up by the UNIVERSIGN team
   * @param {string?} phoneNum This signer’s mobile phoneNum number that should be written in the international format: the country code followed by the phoneNum number (for example, in France 33 XXXXXXXXX).
   * @param {string?} language The language for the signer’s transaction. (@see TransactionSigner.LANGUAGE)
   * @param {string?} birthDate This signer’s birth date. This is an option for the certified signature.
   * @param {string?} universignId An external identifier given by the organization that indicates this signer
   * @param {string?} role The role of this transaction actor. (@see TransactionSigner.ROLE)
   * @param {string?} successURL  The url to where the signer will be redirected, after the signatures are completed.
   *                              If it is null it takes the value of TransactionRequest.successURL. If it is also null, it takes the default Universign success URL.
   * @param {string?} cancelURL   The url to where the signer will be redirected, after the signatures are canceled. If it is null it takes the value of TransactionRequest.cancelURL.
   *                              If it is also null, it takes the value of successURL. If it is also null, it takes the default Universign cancel URL.
   * @param {string?} failURL     The url to where the signer will be redirected, after the signatures are failed. If it is null it takes the value of TransactionRequest.failURL.
   *                              If it is also null, it takes the value of cancelURL. If it is also null, it takes the default Universign failure URL.
   * @param {string?} certificateType Indicates which certificate type will be used to perform the signature and therefore which type of signature will be performed by this signer. (@see TransactionSigner.CERTIFICATE_TYPE)
   */
  constructor({
    emailAddress,
    firstname,
    lastname,
    organization,
    profile,
    phoneNum,
    language,
    birthDate,
    universignId,
    role,
    successURL,
    cancelURL,
    failURL,
    certificateType,
  }) {
    // Pre-validation

    // Creates an error handler
    const errorHandler = createJoiErrorHandler('TransactionSigner');

    // Define the option object
    const options = {
      emailAddress,
      firstname,
      lastname,
      organization,
      profile,
      phoneNum,
      language,
      birthDate,
      universignId,
      role,
      successURL,
      cancelURL,
      failURL,
      certificateType,
    };

    // Define the options validation schema
    const validationSchema = Joi.object().keys({
      emailAddress: Joi.string().required(),
      firstname: Joi.string().optional(),
      lastname: Joi.string().optional(),
      organization: Joi.string().optional(),
      profile: Joi.string().optional(),
      phoneNum: Joi.string().optional(),
      language: Joi.string().valid(Object.values(Language))
        .optional(),
      birthDate: Joi.string().optional(),
      universignId: Joi.string().optional(),
      role: Joi.string().valid(Object.values(Role))
        .optional(),
      successURL: Joi.string().optional(),
      cancelURL: Joi.string().optional(),
      failURL: Joi.string().optional(),
      certificateType: Joi.string().valid(Object.values(CertificateType))
        .optional(),
    })
      .required();

    // Validate and set class attributes
    super(options, validationSchema, errorHandler);
  }
}

module.exports.TransactionSigner = TransactionSigner;
module.exports.CertificateType = CertificateType;
module.exports.Language = Language;
module.exports.Role = Role;

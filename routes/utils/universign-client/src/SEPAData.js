const Joi = require('@hapi/joi');
const createJoiErrorHandler = require('./handle-joi-error');
const BaseObject = require('./BaseObject');
const SEPAThirdParty = require('./SEPAThirdParty');

/**
 * The SEPAData data structure contains information needed to create a SEPA mandate PDF.
 */
module.exports = class SEPAData extends BaseObject {

  /**
   *
   * @param {string} rum A unique mandate identifier.
   * @param {string} ics A unique creditor identifier.
   * @param {string} iban The debtor International Bank Account Number
   * @param {string} bic The debtor Bank Identifier Code.
   * @param {string} recurring Whether this SEPA mandate describe a recurring payment (true) or a single-shot payement (false).
   * @param {SEPAThirdParty} debtor Information on the debtor.
   * @param {SEPAThirdParty} creditor Information on the creaditor
   */
  constructor({
    rum,
    ics,
    iban,
    bic,
    recurring,
    debtor,
    creditor,
  }) {
    // Creates an error handler
    const errorHandler = createJoiErrorHandler('SEPAData');

    // Define the option object
    const options = {
      rum,
      ics,
      iban,
      bic,
      recurring,
      debtor,
      creditor,
    };

    // Define the options validation schema
    const validationSchema = Joi.object().keys({
      rum: Joi.string().required(),
      ics: Joi.string().required(),
      iban: Joi.string().required(),
      bic: Joi.string().required(),
      recurring: Joi.boolean().required(),
      debtor: Joi.object().type(SEPAThirdParty)
        .required(),
      creditor: Joi.object().type(SEPAThirdParty)
        .required(),
    })
      .required();

    // Validate and set class attributes
    super(options, validationSchema, errorHandler);
  }
};

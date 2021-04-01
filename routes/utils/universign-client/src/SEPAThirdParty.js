const Joi = require('@hapi/joi');
const createJoiErrorHandler = require('./handle-joi-error');
const BaseObject = require('./BaseObject');

/**
 * The SEPAThirdParty data structure is used to define information on both the debtor and the creditor of a SEPA mandate.
 */
module.exports = class SEPAThirdParty extends BaseObject {

  /**
   * @param {string} name The full name of this debtor/creditor.
   * @param {string} address The address of this debtor/creditor.
   * @param {string} postalCode The postal code of this debtor/creditor.
   * @param {string} city The city of this debtor/creditor.
   * @param {string} country The country of this debtor/creditor.
   */
  constructor({
    name,
    address,
    postalCode,
    city,
    country,
  }) {
    // Creates an error handler
    const errorHandler = createJoiErrorHandler('SEPAThirdParty');

    // Define the option object
    const options = {
      name,
      address,
      postalCode,
      city,
      country,
    };

    // Define the options validation schema
    const validationSchema = Joi.object().keys({
      name: Joi.string().required(),
      address: Joi.string().required(),
      postalCode: Joi.string().required(),
      city: Joi.string().required(),
      country: Joi.string().required()
    })
      .required();

    // Validate and set class attributes
    super(options, validationSchema, errorHandler);
  }
};

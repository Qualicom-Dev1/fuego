const Joi = require('@hapi/joi');
const createJoiErrorHandler = require('./handle-joi-error');
const BaseObject = require('./BaseObject');

/**
 * A SignatureField describes and contains options for a document signer
 */
module.exports = class SignatureField extends BaseObject {

  /**
   *
   * @param {string} name   The name of the field. If the PDF already contains a named signature field, you can use this parameter instead of giving the coordinates (which will be ignored).
   *                        If the name of this field does not exist in the document, the given coordinates will be used instead.
   * @param {number} page   The page on which the field must appear (starting at ’1’ for the first page).
   *                        Pages are enumerated starting at 1. The value ’-1’ points at the last page.
   * @param {number} x      The field horizontal coordinate on the page.
   * @param {number} y      The field vertical coordinate on the page.
   */
  constructor({
    name,
    page,
    x,
    y,
  }) {
    // Creates an error handler
    const errorHandler = createJoiErrorHandler('SignatureField');

    // Define the option object
    const options = {
      name,
      page,
      x,
      y,
    };

    // Define the options validation schema
    const validationSchema = Joi.object().keys({
      name: Joi.string().optional(),
      page: Joi.number().integer()
        .required(),
      x: Joi.number().integer()
        .required(),
      y: Joi.number().integer()
        .required(),
    })
      .required();

    // Validate and set class attributes
    super(options, validationSchema, errorHandler);
  }
};

const Joi = require('@hapi/joi');
const createJoiErrorHandler = require('./handle-joi-error');
const SignatureField = require('./SignatureField');

/**
 * A DocSignatureField structure have the same data of the SignatureField structure plus DocSignatureFieldOptions.
 */
module.exports = class DocSignatureField extends SignatureField {

  /**
   * @param {number} signerIndex  The index of the signer which uses this field. Signers are enumerated starting at 0.
   * @param (string} patternName  The name of the pattern. May be used if more than one pattern is set.
   *                              The default value is "default". The magic value "invisible" means that the field will not be visible in the PDF.
   * @param (string} label        A label which defines the signature field. This label will be printed in the signature page if set.
   *                              If a signer has more than one field on the same document, label becomes mandatory
   * @param (Buffer} image        The image to be displayed in the signature field, it will replace the default UNIVERSIGN logo.
   *                              Image format must be JPG, JPEG or PNG. A recommended resolution for this image is 150x36px.
   *                              The image will be resized if the image has a different resolution.
   * @param {SignatureField} signatureFieldOptions The SignatureField structure
   */
  constructor({
    signerIndex,
    patternName,
    label,
    // image,
  }, signatureFieldOptions) {
    // Creates an error handler
    const errorHandler = createJoiErrorHandler('DocSignatureField');

    // Define the option object
    const options = {
      signerIndex,
      patternName,
      label,
      // image,
    };

    // Define the options validation schema
    const validationSchema = Joi.object().keys({
      patternName: Joi.string().optional(),
      label:       Joi.string().optional(),
      signerIndex: Joi.number().integer()
        .required(),
    })
      .required();

    // Validate and set class attributes of the parrent class (SignatureField)
    super(signatureFieldOptions);

    // Validate and set class attributes of the current class
    this.validateAndAssign(options, validationSchema, errorHandler);

  }
};

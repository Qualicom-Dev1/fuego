const Joi = require('@hapi/joi');
const createJoiErrorHandler = require('./handle-joi-error');
const BaseObject = require('./BaseObject');
const SignatureField = require('./SignatureField');
const SEPADataInstance = require('./SEPAData');

/**
 * This TransactionDocument type.
 */
const DocumentType = {
  /**
   * The default value. Makes all TransactionDocument members relevant, except for SEPAData
   */
  PDF: 'pdf',

  /**
   * This value marks the document as view only.
   */
  PDF_FOR_PRESENTATION: 'pdf-for-presentation',

  /**
   * This type of PDF document can be refused and not signed by any signer without canceling the transaction.
   */
  PDF_OPTIONAL: 'pdf-optional',

  /**
   * Using this value, no PDF document is provided, but UNIVERSIGN creates a SEPA mandate from data sent in SEPAData, which becomes the single relevant member.
   */
  SEPA: 'sepa'
};

/**
 * A TransactionDocument describes and contains options for a document signer
 */
class TransactionDocument extends BaseObject {

  /**
   * @param {String?} documentType This TransactionDocument type. (@see TransactionDocument. DOCUMENT_TYPE)
   * @param {String?} content The raw content of the PDF document. You can provide the document using the url field, otherwise this field is mandatory.
   * @param {String?} url The URL to download the PDF document. Note that this field is mandatory if the content is not set.
   * @param {String}  fileName The file name of this document.
   * @param {[SignatureField]?} signatureFields A description of a visible PDF signature field.
   * @param {[String]?} checkBoxTexts Texts of the agreement checkboxes. The last one should be the text of the checkbox related to signature fields labels agreement.
   *                                This attribute should not be used with documents of the type "pdf-for-presentation". Since agreement for "pdf-for-presentation" is not customisable.
   * @param {Object?} metaData This structure can only contain simple types like integer, string or date.
   * @param {String?} title A title to be used for display purpose.
   * @param {SEPAData?} SEPAData A structure containing data to create a SEPA mandate PDF.
   */
  constructor({
    documentType,
    content,
    url,
    fileName,
    signatureFields,
    checkBoxTexts,
    metaData,
    title,
    SEPAData,
  }) {
    // Pre-validation
    if ((!documentType || documentType !== DocumentType.SEPA) && (!url && !content)) {
      throw new Error(
        'TransactionDocument - You must define the "content" or the "url" of the PDF file to download'
      );
    } else if (documentType === DocumentType.SEPA && !SEPAData) {
      throw new Error(
        'TransactionDocument - You must define the "SEPAData" since documentType is define as SEPA'
      );
    }

    // Creates an error handler
    const errorHandler = createJoiErrorHandler('TransactionDocument');

    // Define the option object
    const options = {
      documentType,
      content,
      url,
      fileName,
      signatureFields,
      checkBoxTexts,
      metaData,
      title,
      SEPAData,
    };

    // Define the options validation schema
    const validationSchema = Joi.object().keys({
      documentType: Joi.string().valid(Object.values(DocumentType))
        .optional(),
      content: Joi.binary().optional(),
      url: Joi.string().optional(),
      fileName: Joi.string().required(),
      signatureFields: Joi.array().items(Joi.object().type(SignatureField))
        .optional(),
      checkBoxTexts: Joi.array().items(Joi.string())
        .optional(),
      metaData: Joi.object().optional(),
      title: Joi.string().optional(),
      SEPAData: Joi.object().type(SEPADataInstance)
        .optional(),
    })
      .required();

    // Validate and set class attributes
    super(options, validationSchema, errorHandler);
  }
}

module.exports.TransactionDocument = TransactionDocument;
module.exports.DocumentType = DocumentType;

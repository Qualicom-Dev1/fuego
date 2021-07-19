const TransactionDocumentContainer = require('./src/TransactionDocument');
const TransactionRequestContainer = require('./src/TransactionRequest');
const TransactionSignerContainer = require('./src/TransactionSigner');

module.exports = {
  UniversignClient    : require('./src/UniversignClient'),
  SEPAThirdParty      : require('./src/SEPAThirdParty'),
  SEPAData            : require('./src/SEPAData'),
  BasicAuthConfig     : require('./src/BasicAuthConfig'),
  DocSignatureField   : require('./src/DocSignatureField'),
  SignatureField      : require('./src/SignatureField'),

  TransactionDocument : TransactionDocumentContainer.TransactionDocument,
  TransactionDocumentConstants : {
    DocumentType: TransactionDocumentContainer.DocumentType
  },

  TransactionRequest : TransactionRequestContainer.TransactionRequest,
  TransactionRequestConstants : {
    ChainingMode: TransactionRequestContainer.ChainingMode,
    HandwrittenSignatureMode: TransactionRequestContainer.HandwrittenSignatureMode,
    Language: TransactionRequestContainer.Language,
    CertificateType: TransactionRequestContainer.CertificateType,
  },

  TransactionSigner : TransactionSignerContainer.TransactionSigner,
  TransactionSignerConstants : {
    Role: TransactionSignerContainer.Role,
    Language: TransactionSignerContainer.Language,
    CertificateType: TransactionSignerContainer.CertificateType,
  },
};

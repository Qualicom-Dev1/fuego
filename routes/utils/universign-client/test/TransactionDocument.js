const {expect} = require('chai');
const {TransactionDocument, DocumentType} = require('../src/TransactionDocument');

describe('TransactionDocument tests', () => {
  it('should fail without url nor content', () => {
    expect(() => new TransactionDocument({
      fileName: 'test'
    })).to.throw();
  });

  it('should fail without SEPAData if documentType is SEPA', () => {
    expect(() => new TransactionDocument({
      fileName: 'test',
      documentType: DocumentType.SEPA
    })).to.throw();
  });
});

describe('DocumentType tests', () => {
  it('Should contains all propers data', () => {
    expect(DocumentType.SEPA).to.be.equal('sepa');
  });
});

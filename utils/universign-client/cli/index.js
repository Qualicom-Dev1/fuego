const fs = require('fs');
const {
  UniversignClient,
  BasicAuthConfig,
  TransactionRequest,
  TransactionRequestConstants,
  SEPAData,
  SEPAThirdParty,
  TransactionDocument,
  TransactionDocumentConstants,
  TransactionSigner,
  TransactionSignerConstants
} = require('../index');

const client = new UniversignClient({
  url: 'https://ws.universign.eu/sign/rpc/',
  basicAuth: new BasicAuthConfig({
      user: 'xxxxxxxxxxx',
      pass: 'xxxxxxxxxxxxx'
  }),
  https: true
});

const createSignatureRequest = async () => {
  // const rawPDFContent = fs.readFileSync('./universign-guide-7.18.7.pdf');

  const transactionRequest = new TransactionRequest({
    documents: [
      new TransactionDocument({
        documentType: TransactionDocumentConstants.DocumentType.SEPA,
        // content: rawPDFContent,
        // eslint-disable-next-line max-len
        // url: 'https://help.universign.com/hc/fr/article_attachments/360002143258/Guide_d_int_gration_de_la_signature_electronique_Universign_REST_4.pdf',
        fileName: 'Mandat SEPA de Test',
        SEPAData: new SEPAData({
          rum: 'REF_TEST_001',
          ics: 'FR12ZZZ123456', // ICS Creancier
          bic: 'BDFEFR2L', // BIC debiteur
          iban: 'FR7630001007941234567890185', // IBAN debiteur
          recurring: false,
          creditor: new SEPAThirdParty({
            address: '1 Rue du Mas de Verchant',
            city: 'Montpellier',
            country: 'France',
            name: 'MyCompany',
            postalCode: '34000'
          }),
          debtor: new SEPAThirdParty({
            address: '1 rue de quelque part',
            city: 'Montpellier',
            country: 'France',
            name: 'John Doe',
            postalCode: '34000'
          })
        })
      })
    ],
    signers: [
      new TransactionSigner({
        firstname: 'john',
        lastname: 'doe',
        emailAddress: 'john@doe.com'
      })
    ],
    mustContactFirstSigner: true,
    handwrittenSignatureMode: TransactionRequestConstants.HandwrittenSignatureMode.ENABLED,
    profile: 'optimhome',
    // the types of acceptected certificate : simple | all | on-the-fly | local
    certificateType: TransactionRequestConstants.CertificateType.SIMPLE,
    language: TransactionRequestConstants.Language.FRENCH
  });

  console.log({...transactionRequest});

  return client.call('requester.requestTransaction', [transactionRequest]);
};

// @ts-ignore
const getTransactionInfo = async (transactionId) => {
  return client.call('requester.getTransactionInfo', [transactionId]);
};

// @ts-ignore
const getDocuments = async (transactionId) => {
  const response = await client.call('requester.getDocuments', [transactionId]);

  console.log(response);

  for (const document of response) {
    if (document.id && document.content) {
      fs.writeFileSync('./' + document.id + '.pdf', document.content);
    }
  }
};

createSignatureRequest()
// getTransactionInfo('38c5be21-cf9c-4bc2-8e1e-bd45c6f68346')
// getDocuments('38c5be21-cf9c-4bc2-8e1e-bd45c6f68346')
  .then(response => {
    console.log(response);
    process.exit(0);
  })
  .catch(error => {
    UniversignClient.debugResponseError(error);
    process.exit(1);
  });

const xmlrpc = require('xmlrpc');
const BasicAuthConfig = require('./BasicAuthConfig');

/**
 * Create an Universign Client able to perform calls to specific method using async/await
 */
module.exports = class UniversignClient {
  /**
   * Debug the response errog with console.log
   * @param {object} error Error object from a call
   * @return {void}
   */
  static debugResponseError(error) {
    console.log('error:', error);
    console.log('req headers:', error.req && error.req._header);
    console.log('res code:', error.res && error.res.statusCode);
    console.log('res body:', error.body);
  }

  /**
   * @param {BasicAuthConfig} basicAuth Basic Auth object
   * @param {string} url URL to universign API
   * @param {boolean} https Set to true if the protocol is HTTPS
   */
  constructor({
    basicAuth,
    url = 'https://ws.universign.eu/sign/rpc/',
    https = true
  }) {
    const clientOptions = {
      basic_auth: basicAuth instanceof BasicAuthConfig ? basicAuth : undefined,
      url
    };

    const xmlRpcCreateClientMethod = https
      ? 'createSecureClient'
      : 'createClient';

    // Creates an XML-RPC client.
    // Passes the host information on where to make the XML-RPC calls.
    this.xmlrpcClient = xmlrpc[xmlRpcCreateClientMethod](clientOptions);
  }

  /**
   * Make the XML-RPC calls
   * @param {string} method Method name to call
   * @param {array} params Array of params to pass to the call
   * @return {Promise} A promise to call the method
   */
  async call(method, params = []) {
    return new Promise((resolve, reject) => {
      this.xmlrpcClient.methodCall(method, params, (error, value) => {
        if (error) {
          return reject(error);
        }

        return resolve(value);
      });
    });
  }
};

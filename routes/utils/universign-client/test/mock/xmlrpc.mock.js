const mock = require('mock-require');

const fakeXmlRpcClient = {
  methodCall: (
    method,
    params,
    callback
  ) => {
    const value = [{ method, params }];
    const error = null;
    
    return callback(error, value);
  }
};

mock('xmlrpc', {
  createClient: () => fakeXmlRpcClient,
  createSecureClient: () => fakeXmlRpcClient
});

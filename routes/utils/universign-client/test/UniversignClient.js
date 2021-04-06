const {expect} = require('chai');
require('./mock/xmlrpc.mock');
const UniversignClient = require('../src/UniversignClient');
const BasicAuthConfig = require('../src/BasicAuthConfig');

describe('UniversignClient tests', () => {
  it('should instanciat without fails', async () => {
    let client;
    expect(() => client = new UniversignClient({
      url: 'https://universign.url/',
      basicAuth: new BasicAuthConfig({
        user: 'foo',
        pass: 'bar'
      }),
      https: true
    })).to.not.throw();

    const callMethodResponse = await client.call('test', [{ foo: 'bar' }]);

    expect(callMethodResponse).to.deep.equal(callMethodResponse, [
      { method: 'test', params: [{ foo: 'bar' }] }
    ]);
  });
});

const {expect} = require('chai');
const BasicAuthConfig = require('../src/BasicAuthConfig');

describe('BasicAuthConfig tests', () => {
  it('should fail without user', () => {
    expect(() => new BasicAuthConfig({pass: 'test'})).to.throw();
  });

  it('should fail without pass', () => {
    expect(() => new BasicAuthConfig({user: 'test'})).to.throw();
  });

  it('should fail without pass or user', () => {
    expect(() => new BasicAuthConfig({})).to.throw();
  });

  it('should fail without arguments', () => {
    expect(() => new BasicAuthConfig()).to.throw();
  });

  it('should pass with user and pass', () => {
    let instance = null;
    expect(() => instance = new BasicAuthConfig({pass: 'foo', user: 'bar'})).to.not.throw();

    expect(instance).to.have.property('pass', 'foo');
    expect(instance).to.have.property('user', 'bar');
  });
});

const Joi = require('@hapi/joi');
const createJoiErrorHandler = require('./handle-joi-error');
const BaseObject = require('./BaseObject');

/**
 * Basic Auth Config options
 */
module.exports = class BasicAuthConfig extends BaseObject {
  /**
   * Basic Auth Config options
   * @param {string} user Username
   * @param {string} pass Password
   */
  constructor({user, pass}) {
    // Creates an error handler
    const errorHandler = createJoiErrorHandler('BasicAuthConfig');

    // Define the option object
    const options = {user, pass};

    // Define the options validation schema
    const validationSchema = Joi.object().keys({
      // Username
      user: Joi.string().required(),
      // Password
      pass: Joi.string().required(),
    })
      .required();

    // Validate and set class attributes
    super(options, validationSchema, errorHandler);
  }
};

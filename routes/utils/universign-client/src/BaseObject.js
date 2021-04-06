const Joi = require('@hapi/joi');

/**
 *
 */
module.exports = class BaseObject {
  /**
   * @param {object} options Options
   * @param {object} validationSchema
   * @param {function} errorHandler
   */
  constructor(options, validationSchema, errorHandler) {
    this.validateAndAssign(options, validationSchema, errorHandler);
  }

  /**
   *
   * @param {object} options Options
   * @param {object} validationSchema
   * @param {function} errorHandler
   */
  validateAndAssign(options, validationSchema, errorHandler) {
    // Let's validate options
    const result = validationSchema.validate(options);

    // Handles validation errors
    if (result.error) {
      errorHandler(result.error);
    }

    const filteredValues = {};
    for (const key in result.value) {
      if (result.value.hasOwnProperty(key) && typeof result.value[key] !== 'undefined') {
        filteredValues[key] = result.value[key];
      }
    }

    // Map validated options to this class
    Object.assign(this, filteredValues);
  }
};

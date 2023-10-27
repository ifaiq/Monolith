const { validate } = require('../../utils/services');
const productValidation = require('../modules/v1/BusinessUnit/BusinessUnitJoiValidations');
/**
 * Validates params from the request object using JOI validations 
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
module.exports = async (req, res, next) => {
  try {
    const schema = req.options.validate;
    await validate(productValidation[schema], req);
    next();
  }
  catch (err) {
    res.badRequest(err.message);
  }
};

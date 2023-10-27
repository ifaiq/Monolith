const { validate } = require('../../utils/services');
const userValidation = require('../modules/v1/Auth/UserJoiValidation');

module.exports = async (req, res, next) => {
  try {
    const schema = req.options.validate;
    if (schema) {
      await validate(userValidation[schema], req);
    }
    next();
  }
  catch (err) {
    res.badRequest(err.message);
  }
};

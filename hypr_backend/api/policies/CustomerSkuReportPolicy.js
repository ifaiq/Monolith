const { validate } = require("../../utils/services");
const { customerSkuReportValidation } = require("../modules/v1/CustomerSkuReport");

module.exports = async (req, res, next) => {
  try {
    const schema = req.options.validate;
    if (schema) {
      await validate(customerSkuReportValidation[schema], req);
    }
    next();
  } catch (err) {
    res.badRequest(err.message);
  }
};

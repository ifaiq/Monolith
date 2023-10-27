const { validate } = require("../../utils/services");
const { skuDeactivationReasonValidation } = require("../modules/v1/SkuDeactivationReason");

module.exports = async (req, res, next) => {
  try {
    const schema = req.options.validate;
    if (schema) {
      await validate(skuDeactivationReasonValidation[schema], req);
    }
    next();
  } catch (err) {
    res.badRequest(err.message);
  }
};

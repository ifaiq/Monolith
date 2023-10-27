const { validate } = require("../../utils/services");
const { deliverySlotsValidation } = require("../modules/v1/DeliverySlots");

module.exports = async (req, res, next) => {
  try {
    const schema = req.options.validate;
    if (schema) {
      await validate(deliverySlotsValidation[schema], req);
    }
    next();
  } catch (err) {
    res.badRequest(err.message);
  }
};

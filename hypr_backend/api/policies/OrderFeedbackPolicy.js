const { validate } = require("../../utils/services");
const orderFeedbackValidation = require("../modules/v1/OrderFeedback/OrderFeedbackJoiValidation");

module.exports = async (req, res, next) => {
  try {
    const schema = req.options.validate;
    if (schema) {
      await validate(orderFeedbackValidation[schema], req);
    }
    next();
  } catch (err) {
    res.error(err);
  }
};

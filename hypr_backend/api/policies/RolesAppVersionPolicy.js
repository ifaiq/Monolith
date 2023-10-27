const { validate } = require("../../utils/services");
const { rolesAppVersionValidator } = require("../modules/v1/RolesAppVersion");

module.exports = async (req, res, next) => {
  try {
    const schema = req.options.validate;
    if (schema) {
      await validate(rolesAppVersionValidator[schema], req);
    }
    next();
  } catch (err) {
    res.badRequest(err.message);
  }
};

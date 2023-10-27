const { validate } = require('../../utils/services');
const orderValidation = require('../modules/v1/Order/OrderJoiValidation');

module.exports = async (req, res, next) => {
    try {
        const schema = req.options.validate;
        if (schema) {
            await validate(orderValidation[schema], req);
        }
        next();
    }
    catch (err) {
        res.badRequest(err.message);
    }
};

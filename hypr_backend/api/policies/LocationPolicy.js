const { validate } = require('../../utils/services');
const locationValidation = require('../modules/v1/Location/LocationJoiValidation');

module.exports = async (req, res, next) => {
    try {
        const schema = req.options.validate;
        if (schema) {
            await validate(locationValidation[schema], req);
        }
        next();
    }
    catch (err) {
        res.badRequest(err.message);
    }
};

const { validate } = require('../../utils/services');
const batchValidation = require('../modules/v1/Batch/BatchJoiValidation');

module.exports = async (req, res, next) => {
    try {
        const schema = req.options.validate;
        if (schema) {
            await validate(batchValidation[schema], req);
        }
        next();
    }
    catch (err) {
        res.badRequest(err.message);
    }
};

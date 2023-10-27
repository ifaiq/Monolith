const { validate } = require('../../utils/services');
const { userNotificationJoiValidation: userNotificationValidation } = require('../modules/v1/UserNotification');

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
        await validate(userNotificationValidation[schema], req);
        next();
    }
    catch (err) {
        res.badRequest(err.message);
    }
};

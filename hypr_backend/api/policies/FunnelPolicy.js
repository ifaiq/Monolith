const { validate } = require('../../utils/services');
const { categoryJoiValidations: categoryValidation } = require('../modules/v1/Funnel');

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
        let clonedParams = _.cloneDeep(req.query);
        for (const param in clonedParams) {
            if (!isNaN(Number(clonedParams[param]))) {
                clonedParams[param] = Number(clonedParams[param]);
            }
        }
        await validate(categoryValidation[schema], { query: clonedParams });
        next();
    }
    catch (err) {
        res.badRequest(err.message);
    }
};

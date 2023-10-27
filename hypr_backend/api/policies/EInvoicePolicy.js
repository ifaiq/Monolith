const { validate } = require('../../utils/services');
const { eInvoiceValidation } = require('../modules/v1/EInvoice');

/**
 * Validates params from the request object using JOI validations 
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
module.exports = async (req, res, next) => {
    try {
        const { locals: { userData: { role: { id: roleId } } } } = res;
        const { HyprRoles: { CONSUMER, DELIVERY, SUPERVISOR, ADMIN, COMPANY_OWNER } } = Constants;
        if (roleId !== CONSUMER && roleId !== DELIVERY  && roleId !== ADMIN && roleId !== SUPERVISOR && roleId !== COMPANY_OWNER ) return res.unauthorized();
        const schema = req.options.validate;
        await validate(eInvoiceValidation[schema], req);
        next();
    }
    catch (err) {
        res.badRequest(err.message);
    }
};

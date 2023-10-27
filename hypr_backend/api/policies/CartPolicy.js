const { validate } = require('../../utils/services');
const cartValidation = require('../modules/v1/Cart/CartJoiValidation');
const { validateCustomerId } = require('../modules/v1/Order/OrderValidator');
const { HyprRoles: { SUPERVISOR } } = require('../services/Constants');


module.exports = async (req, res, next) => {
  try {
    const schema = req.options.validate;

    if (schema.toLowerCase() === "putcartvalidation" &&
      req.options.action.toLowerCase().indexOf("updateforexternalresource") >= 0) {
      req.user = req.body.user;
    }

    const { user: { role }, query: { customerId }, query } = req;

    if (schema) {
      await validate(cartValidation[schema], req);
    }
    /**
      * This check is for the agent flow.
      * 
      * If role is SUPERVISOR. customerid should exists in the req.
      * Update user id to customer id.
      */
        if (+role === +SUPERVISOR) {
            validateCustomerId(query);
            req.user.id = +customerId;
            req.userId = +customerId;
        }
        next();
    }
    catch (err) {
        res.badRequest(err.message);
    }
};

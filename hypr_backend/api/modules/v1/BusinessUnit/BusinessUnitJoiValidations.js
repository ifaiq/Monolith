const { Joi } = require("../../../../utils/services");

/**
 * Defines Schema to perform JOI validations
 * - GET /api/v1/business-unit/:id
 */
const getBusinessUnitByIdValidation = Joi.object()
  .keys({
    params: {
      id: Joi.string().pattern(/^[0-9]+$/).required(),
    },
  });

module.exports = {
  getBusinessUnitByIdValidation,
};

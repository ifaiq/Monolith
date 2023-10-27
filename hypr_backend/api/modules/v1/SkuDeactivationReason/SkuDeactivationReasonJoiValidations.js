const { Joi } = require("../../../../utils/services");

/* Validating the request body of createSkuDeactivationReason. */
const createSkuDeactivationReasonValidation = Joi.object().keys({
  body: Joi.object({
    reason: Joi.string().required(),
    type: Joi.string().valid("ENABLED", "DISABLED").required(),
  }).unknown(true),
});

/* Validating the request body of updateSkuDeactivationReason. */
const updateSkuDeactivationReasonValidation = Joi.object().keys({
  body: Joi.object({
    id: Joi.number().required(),
    reason: Joi.string(),
    type: Joi.string().valid("ENABLED", "DISABLED"),
  }).unknown(true),
});

/* Validating the request body of deleteSkuDeactivationReason. */
const deleteSkuDeactivationReasonValidation = Joi.object().keys({
  body: Joi.object({
    id: Joi.number().required(),
  }).unknown(true),
});

module.exports = {
  createSkuDeactivationReasonValidation,
  updateSkuDeactivationReasonValidation,
  deleteSkuDeactivationReasonValidation,
};

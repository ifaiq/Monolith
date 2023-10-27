const { Joi } = require("../../../../utils/services");

const createOrderFeedbackValidation = Joi.object().keys({
  body: Joi.object({
    isSatisfied: Joi.boolean().strict().optional(),
    orderId: Joi.number().integer().positive().strict().required(),
    notes: Joi.string().optional(),
    dismissed: Joi.boolean().strict().optional(),
  }).unknown(false),
});

const getOrderFeedbackValidation = Joi.object().keys({
  query: Joi.object({
    orderId: Joi.number().integer().positive().required(),
  }).unknown(false),
});

const getCustomerFeedbackValidation = Joi.object().keys({
  query: Joi.object({
    retailerId: Joi.number().integer().positive().required(),
    limit: Joi.number().integer().optional(),
    offset: Joi.number().integer().optional(),
  }).unknown(false),
});

const getFeedbackMissingOrderValidation = Joi.object().keys({});

module.exports = {
  createOrderFeedbackValidation,
  getOrderFeedbackValidation,
  getCustomerFeedbackValidation,
  getFeedbackMissingOrderValidation,
};

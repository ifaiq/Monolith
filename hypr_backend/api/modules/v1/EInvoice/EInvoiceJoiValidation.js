const { Joi } = require("../../../../utils/services");

const postInvoiceValidation = Joi.object()
  .keys({
    body: {
      orderId: Joi.number().integer().required(),
    },
  });

const getThermalInvoiceByOrderIdValidation = Joi.object().keys({
  query: {
    orderId: Joi.number().integer().required(),
    paperSize: Joi.string(),
  },
});

const bulkCnCreationValidation = Joi.object().keys({
  query: {
    file_name: Joi.string(),
    file_url: Joi.string(),
    location_id: Joi.string(),
    user_id: Joi.number(),
  },
});
module.exports = {
  postInvoiceValidation,
  getThermalInvoiceByOrderIdValidation,
  bulkCnCreationValidation,
};

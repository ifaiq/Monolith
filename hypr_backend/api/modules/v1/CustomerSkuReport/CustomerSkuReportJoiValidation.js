const { Joi } = require("../../../../utils/services");

const createReportUserSkuValidation = Joi.object().keys({
  body: Joi.object({
    filename: Joi.string().required(),
    fileurl: Joi.string().required(),
  }).unknown(false),
});

const getCustomerReportSkuValidation = Joi.object().keys({
  query: Joi.object({
    page: Joi.string().required(),
    perPage: Joi.string().required(),
  }),
});


module.exports = {
  createReportUserSkuValidation,
  getCustomerReportSkuValidation,
};

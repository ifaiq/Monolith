const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./EInvoiceJoiValidation");
const { getSwaggerSchema } = require("../../../../swagger/utils");

const postInvoiceValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.postInvoiceValidation).swagger);
const getThermalInvoiceByOrderIdValidationSchema =
    getSwaggerSchema(joiToSwagger(validationSchema.getThermalInvoiceByOrderIdValidation).swagger);
const bulkCnCreationValidationSchema =
    getSwaggerSchema(joiToSwagger(validationSchema.bulkCnCreationValidation).swagger);

module.exports = {
  postInvoiceValidationSchema,
  getThermalInvoiceByOrderIdValidationSchema,
  bulkCnCreationValidationSchema,
};

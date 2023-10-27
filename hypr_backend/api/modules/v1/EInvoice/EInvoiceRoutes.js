const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");

const controller = `${v1}/EInvoiceController`;
const eInvoiceSwagger = require("./EinvoiceSwagger");

module.exports = {
  "POST /": {
    controller,
    action: "postInvoice",
    validate: "postInvoiceValidation",
    swagger: eInvoiceSwagger.postInvoiceValidationSchema,
  },
  "GET /logistics": {
    controller,
    action: "getThermalInvoiceByOrderId",
    validate: "getThermalInvoiceByOrderIdValidation",
    swagger: eInvoiceSwagger.getThermalInvoiceByOrderIdValidationSchema,
  },
  "POST /credit-note": {
    controller,
    action: "postCreditNote",
    validate: "postInvoiceValidation",
    swagger: eInvoiceSwagger.postInvoiceValidationSchema,
  },
  "POST /bulk-generate-cn": {
    controller,
    action: "bulkGenerateCNsAndInvoices",
    validate: "bulkCnCreationValidation",
    swagger: eInvoiceSwagger.bulkCnCreationValidationSchema,
  },
};

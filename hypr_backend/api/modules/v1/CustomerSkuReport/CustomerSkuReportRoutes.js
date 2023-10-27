const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");

const createReportUserSkuSwagger =  require("./CustomerSkuReportSwagger");

const controller = `${v1}/CustomerSkuReport`;
module.exports = {
  "POST /": {
    controller,
    action: "createReportUserSku",
    validate: "createReportUserSkuValidation",
    swagger: createReportUserSkuSwagger.createReportUserSkuValidationSchema,
  },

  "GET /": {
    controller,
    action: "getCustomerReportSkus",
    validate: "getCustomerReportSkuValidation",
    swagger: createReportUserSkuSwagger.getCustomerReportSkusSchema,
  },
};

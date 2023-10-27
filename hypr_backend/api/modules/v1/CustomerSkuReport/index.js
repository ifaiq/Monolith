const customerSkuReportRoutes = require("./CustomerSkuReportRoutes");
const customerSkuReportService = require("./CustomerSkuReportService");
const customerSkuReportValidation = require("./CustomerSkuReportJoiValidation");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const {
  constants: {
    request: {
      VERSIONING: { v1, prefix },
    },
  },
} = require("../../../constants/http");

module.exports = {
  customerSkuReportRoutes: addPrefixWithRoutes(
    `/${prefix}/${v1}/report-customer-sku`,
    customerSkuReportRoutes,
  ),
  customerSkuReportService,
  customerSkuReportValidation,
};

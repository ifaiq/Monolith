const eInvoiceService = require("./EInvoiceService");
const eInvoiceRoutes = require("./EInvoiceRoutes");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const { constants: { request: { VERSIONING: { v1, prefix } } } } = require("../../../constants/http");
const eInvoiceValidation = require("./EInvoiceJoiValidation");
const eInvoiceUtils = require("./Utils");

module.exports = {
  eInvoiceRoutes: addPrefixWithRoutes(`/${prefix}/${v1}/e-invoice`, eInvoiceRoutes),
  eInvoiceService,
  eInvoiceValidation,
  eInvoiceUtils,
};

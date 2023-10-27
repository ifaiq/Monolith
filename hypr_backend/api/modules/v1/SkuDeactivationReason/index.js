const skuDeactivationReasonRoutes = require("./SkuDeactivationReasonRoutes");
const skuDeactivationReasonService = require("./SkuDeactivationReasonService");
const skuDeactivationReasonValidation = require("./SkuDeactivationReasonJoiValidations");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const {
  constants: {
    request: {
      VERSIONING: { v1, prefix },
    },
  },
} = require("../../../constants/http");

module.exports = {
  skuDeactivationReasonRoutes: addPrefixWithRoutes(
    `/${prefix}/${v1}/sku-deactivation-reason`,
    skuDeactivationReasonRoutes,
  ),
  skuDeactivationReasonService,
  skuDeactivationReasonValidation,
};

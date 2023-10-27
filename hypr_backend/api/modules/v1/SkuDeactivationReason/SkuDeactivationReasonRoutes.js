const {
  constants: {
    request: {
      VERSIONING: { v1 },
    },
  },
} = require("../../../constants/http");
const skuDeactivationReasonSwagger = require("./SkuDeactivationReasonSwagger");

const controller = `${v1}/SkuDeactivationReasonController`;

module.exports = {
  "POST /": {
    controller,
    action: "createSkuDeactivationReason",
    validate: "createSkuDeactivationReasonValidation",
    swagger: skuDeactivationReasonSwagger.createSkuDeactivationReason,
  },
  "GET /": {
    controller,
    action: "getSkuDeactivationReason",
    swagger: skuDeactivationReasonSwagger.getSkuDeactivationReason,
  },
  "PUT /": {
    controller,
    action: "updateSkuDeactivationReason",
    validate: "updateSkuDeactivationReasonValidation",
    swagger: skuDeactivationReasonSwagger.updateSkuDeactivationReason,
  },
  "DELETE /": {
    controller,
    action: "deleteSkuDeactivationReason",
    validate: "deleteSkuDeactivationReasonValidation",
    swagger: skuDeactivationReasonSwagger.deleteSkuDeactivationReason,

  },
};

const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const controller = `${v1}/BatchController`;
const batchSwagger = require("./BatchSwagger");

module.exports = {
  "PUT /:id": {
    controller, action: "update", validate: "putBatchValidation",
    swagger: batchSwagger.putBatchValidationSchema,
  },
  "GET /getBatchPerformance": { controller, action: "getBatchPerformance" },
  "GET /active": { controller, action: "getActiveBatch" },
  "GET /": { controller, action: "getBatches" },
  "POST /": { controller, action: "acceptBatch" },
  "GET /:id/orders": { controller, action: "getOrdersByBatchId", validate: "getOrdersByBatchValidation",
    swagger: batchSwagger.getOrdersByBatchValidationSchema },
  "GET /:id/customer/orders": { controller, action: "getOrdersOfCustomerByBatch",
    validate: "getOrdersByBatchValidation" },
  "GET /spot-products": { controller, action: "getSpotProductsByBatchId",
    validate: "getSpotProductsValidation",
    swagger: batchSwagger.getSpotProductsValidationSchema,
  },
  "GET /status": { controller, action: "getBatchStatusByBatchId",
    validate: "getBatchStatusValidation",
    swagger: batchSwagger.getBatchStatusValidationSchema,
  },
  "GET /getRtgCompleted/:agentId": {
    controller,
    action: "getRtgCompleted",
    validate: "getRtgCompletedValidation",
    swagger: batchSwagger.getRtgCompletedValidationSchema,
  },
  "GET /getBatchReturnedProducts/:batchId": {
    controller,
    action: "getBatchReturnedProducts",
    validate: "getBatchIdValidation",
    swagger: batchSwagger.getBatchIdValidationSchema,
  },
  "GET /getRtgCompletedProducts/:batchId": {
    controller,
    action: "getRtgCompletedProducts",
    validate: "getBatchIdValidation",
    swagger: batchSwagger.getBatchIdValidationSchema,
  },
  "GET /getInventoryShortage/:batchId": {
    controller,
    action: "getInventoryShortage",
    validate: "getBatchIdValidation",
    swagger: batchSwagger.getBatchIdValidationSchema,
  },
  "GET /getBatchRemainingProducts/:batchId": {
    controller,
    action: "getBatchRemainingProducts",
    validate: "getBatchIdValidation",
    swagger: batchSwagger.getBatchIdValidationSchema,
  },
  "PUT /updateBatchRtgStatus/:batchId": {
    controller,
    action: "updateBatchRtgStatus",
    validate: "putBatchRtgStatusValidation",
    swagger: batchSwagger.putBatchRtgStatusValidationSchema,
  },
  "PUT /batchRtgAssign/:batchId": {
    controller,
    action: "batchRtgAssign",
    validate: "batchRtgAssignValidation",
    swagger: batchSwagger.batchRtgAssignValidationSchema,
  },
  "PUT /batchRtgUnassign/:batchId": {
    controller,
    action: "batchRtgUnassign",
    validate: "batchRtgUnassignValidation",
    swagger: batchSwagger.batchRtgUnassignValidationSchema,
  },
  "POST /saveCashClosing/:batchId": {
    controller,
    action: "saveCashClosing",
    validate: "saveCashClosingValidation",
    swagger: batchSwagger.saveCashClosingValidationSchema,
  },
  "GET /getCashClosing/:batchId": {
    controller,
    action: "getCashClosing",
    validate: "getCashClosingValidation",
    swagger: batchSwagger.getCashClosingValidationSchema,
  },
  "GET /searchProductsInBatch/:batchId": {
    controller,
    action: "searchProductsInBatch",
    validate: "getsearchProductsInBatchValidation",
    swagger: batchSwagger.getSearchProductsInBatchValidationSchema,
  },
  "POST /attachSave": {
    controller,
    action: "attachSave",
    validate: "attachSaveInBatchValidation",
    swagger: batchSwagger.attachSaveInBatchValidationSchema,
  },
};

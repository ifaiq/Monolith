const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const orderSwagger = require("./OrderSwagger");

const controller = `${v1}/OrderController`;

module.exports = {
  "POST /": {
    controller, action: "create", validate: "postOrderValidation",
    swagger: orderSwagger.postOrderValidationSchema,
  },
  "PUT  /setOrderStatusLogistic": {
    controller, action: "updateStatusLogistic", validate: "putOrderStatusValidation",
    swagger: orderSwagger.updateOrderStatusFromLogisticsSchema,
  },
  "PUT  /setOrderStatusPortal": {
    controller, action: "updateStatusPortal", validate: "putOrderStatusValidation",
    swagger: orderSwagger.updateOrderStatusFromPortalSchema,
  },
  "PUT  /setOrderStatusConsumer": {
    controller, action: "updateStatusConsumer", validate: "putOrderStatusValidation",
    swagger: orderSwagger.updateOrderStatusFromConsumerSchema,
  },
  "PUT  /recalculateOrderTotal": {
    controller, action: "recalculateOrderTotal", swagger: { deprecated: true },
  },
  "GET  /statuses": {
    controller, action: "getOrders", validate: "putOrderStatusesValidation",
    swagger: orderSwagger.putOrderStatusesValidationSchema,
  },
  "GET  /:id": {
    controller, action: "getOrder", validate: "putOrderValidation",
    swagger: orderSwagger.getOrderByIdSchema,
  },
  "GET  /getOrderExternalResource/:id": {
    controller, action: "getOrderExternalResource", validate: "putOrderValidation",
    swagger: orderSwagger.getOrderByIdSchema,
  },
  "PUT /bulkExpireCoupons": {
    controller, action: "bulkExpireCoupons", swagger: { deprecated: true },
  },
  "PUT /updateOrderPaymentType": {
    controller,
    action: "updateOrderPaymentType",
    validate: "putOrderPaymentTypeValidation",
    swagger: orderSwagger.putOrderPaymentTypeValidationSchema,
  },
  "GET /findOrderPaymentType": {
    controller,
    action: "findOrderPaymentType",
    validate: "getOrderPaymentType",
    swagger: orderSwagger.getOrderPaymentTypeSchema,
  },
  "GET /findLatestOrderByCustomerId": {
    controller,
    action: "findLatestOrderByCustomerId",
    validate: "getLatestOrderByCustomerId",
    swagger: orderSwagger.getLatestOrderByCustomerIdSchema,
  },
  "GET /growthMetrics": {
    controller,
    action: "getGrowthOrderMetrics",
    validate: "getGrowthOrderMetrics",
    swagger: orderSwagger.getGrowthOrderMetricsSchema,
  },
  "GET  /getCategoriesDgmvByCustomerId": {
    controller, action: "getCategoriesDgmvByCustomerId",
    validate: "getCategoriesDgmvByCustomerId",
    swagger: orderSwagger.getDGMVbyCustomerIdValidationSchema,
  },
  "POST /spot-sale": {
    controller, action: "createSpotOrder", validate: "spotOrderValidation",
    swagger: orderSwagger.spotSaleOrderValidationSchema,
  },
  "GET /:id/items": {
    controller,
    action: "fetchOrderItems",
    validate: "fetchOrderItemsValidation",
    swagger: orderSwagger.fetchOrderItemsValidationSchema,
  },
};

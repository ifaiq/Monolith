const OrderRoutes = require("./OrderRoutes");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const { constants: { request: { VERSIONING: { v1, prefix } } } } = require("../../../constants/http");
const orderService = require("./OrderService");
const orderItemService = require("./OrderItemService");
const orderHistoryService = require("./OrderHistoryService");
const orderStatusHistoryService = require("./OrderStatusHistoryService");
const { messages } = require("./Messages");

module.exports = {
  orderRoutes: addPrefixWithRoutes(`/${prefix}/${v1}/order`, OrderRoutes),
  orderService,
  orderItemService,
  orderHistoryService,
  orderStatusHistoryService,
  messages,
};

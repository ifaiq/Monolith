const {
  orderService: {
    getOrderById,
    placeOrder,
    updateOrderStatusLogistics,
    updateOrderStatusPortal,
    updateOrderPaymentType: updatePaymentType,
    findPaymentTypeByOrderId,
    getLatestOrderByCustomerId,
    getOrders: getOrderStatuses,
    updateOrderStatusConsumer,
    getGrowthMetrics,
    // fixOrderTotal,
    getCategoriesDgmvByCustomerIds,
    findOrderByIdAndPopulateItems,
    validateSpotProducts,
    getOrderItems,
  },
  messages: { ORDER_STATUS_UPDATED, ORDER_CREATED },
} = require("../../modules/v1/Order");

const { assignOrderToBatch } = require("../../modules/v1/Batch/BatchService");
const {
  couponService: {
    // expireCoupons,
  },
} = require("../../modules/v1/Coupon/index");

const {
  ORDER_STATES: {
    IN_TRANSIT,
    PACKED,
    DELIVERED,
  },
} = require("../../modules/v1/Order/Constants");

const DeviceId = "device_id";
const AppVersion = "app_version";
/**
 * The function takes the req and the res and created the order.
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Array} order
 */
const create = async (req, res) => {
  const {
    body,
    user,
    user: { id, role },
    headers,
    query: { validateDeliveryTime = false },
  } = req;
  const logIdentifier = `API version: V1, context: OrderController.create(), UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with body -> ${JSON.stringify(body)}`);
    const order = await placeOrder(
      body,
      {
        ...user,
        clientTimeOffset: headers.clienttimeoffset,
        language: headers.language,
      },
      headers[DeviceId],
      headers[AppVersion],
      id,
      validateDeliveryTime,
    );

    // TODO PLACE IN CONSTANTS FILE
    const responseOptions = {
      userMessage: ORDER_CREATED(),
    };
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(order)}`);
    return res.ok(order, responseOptions);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    return res.error(error);
  }
};

/**
 * The function takes the req and the res and return the orders.
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Array} orders
 */
const getOrders = async (req, res) => {
  const { user: { id, role }, query: { id: searchId, page, perPage, customerId } } = req;
  const logIdentifier = `API version: V1, context: OrderController.getOrders(), UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const orders = await getOrderStatuses(id, role, searchId, page, perPage, customerId);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(orders)}`);
    res.ok(orders);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * This function takes customer Id and return latest order.
 * @param {Number} id
 * @returns {Order} orderData
 */
const findLatestOrderByCustomerId = async (req, res) => {
  const { id } = req.allParams();
  const logIdentifier = `API version: V1,context: OrderController.findLatestOrderByCustomerId(), CustomerId: ${id}`;

  try {
    const orderData = await getLatestOrderByCustomerId(id);
    return res.ok(orderData);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    return res.error(error);
  }
};

/**
 * The function takes the req and the res and return the order.
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Array} order
 */
const getOrder = async (req, res) => {
  const { user: { role }, userId } = req;
  const { id } = req.allParams();
  const logIdentifier = `API version: V1, context: OrderController.getOrder(), ` +
    `OrderId: ${id}, UserId: ${userId}, Role: ${role},`;
  try {
    const order = await getOrderById(id);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(order)}`);
    res.ok(order);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * The function takes the req and the res and update the order.
 *
 * @param {Object} req
 * @param {Object} res
 */
const updateStatusLogistic = async (req, res) => {
  const { headers: { app_version }, user: { id, role } } = req;
  const { statusId, orderId, statusReasonId, orderItems, waiver, cashReceived } = req.allParams();

  const logIdentifier = `API version: V1, context: OrderController.updateStatusLogistic(), ` +
    `OrderId: ${orderId}, StatusId: ${statusId}, UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    await updateOrderStatusLogistics(
      statusId,
      orderId,
      statusReasonId,
      orderItems,
      cashReceived,
      waiver,
      app_version,
      id,
      role,
    );
    res.ok(ORDER_STATUS_UPDATED());
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * The function takes the req and the res and update the order.
 *
 * @param {Object} req
 * @param {Object} res
 */
const updateStatusPortal = async (req, res) => {
  const { user: { id, role } } = req;
  const { statusId, orderId, statusReasonId, orderItems } = req.allParams();

  const logIdentifier = `API version: V1, context: OrderController.updateStatusPortal(), ` +
    `OrderId: ${orderId}, StatusId: ${statusId}, UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    await updateOrderStatusPortal(statusId, orderId, statusReasonId, orderItems, id, role);
    res.ok(ORDER_STATUS_UPDATED());
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * The function takes the req and the res and update the order.
 *
 * @param {Object} req
 * @param {Object} res
 */
const updateOrderPaymentType = async (req, res) => {
  const { user: { id, role } } = req;
  const { orderId, orderAmount, paymentType, loanProductId } = req.allParams();

  const logIdentifier = `API version: V1,context: OrderController.updateOrderPaymentType(), OrderId: ${orderId}, ` +
    `UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const updatedOrder = await updatePaymentType(orderId, orderAmount, paymentType, loanProductId,
    );
    res.ok(updatedOrder);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * This function takes orderId and return current order payment type.
 * @param {Number} id
 * @returns {String} paymentType
 */
const findOrderPaymentType = async (req, res) => {
  const { user: { role }, userId } = req;
  const { id } = req.allParams();

  const logIdentifier = `API version: V1,context: OrderController.findOrderPaymentType(), UserId: ${userId}, ` +
    `Role: ${role},`;

  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    const paymentType = await findPaymentTypeByOrderId(id);
    return res.ok(paymentType);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    return res.error(error);
  }
};

/**
 * The function takes the req and the res and update the order.
 *
 * @param {Object} req
 * @param {Object} res
 */
const updateStatusConsumer = async (req, res) => {
  const { user: { id, role }, headers } = req;
  const { statusId, orderId, statusReasonId, orderItems } = req.allParams();

  const logIdentifier = `API version: V1, context: OrderController.updateStatusConsumer(), ` +
    `OrderId: ${orderId}, StatusId: ${statusId}, CustomerId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    await updateOrderStatusConsumer(statusId, orderId, statusReasonId, orderItems, id, role, headers[DeviceId]);
    res.ok(ORDER_STATUS_UPDATED());
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};


/**
 * The function takes the req and the res and return the metrics.
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Object} metrics
 */
const getGrowthOrderMetrics = async (req, res) => {
  const { user: { id, role }, query: { customerId, startTime, endTime, select, deliveryBatches } } = req;
  const logIdentifier =
    `API version: V1, context: OrderController.getGrowthOrderMetrics(), UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const metrics = await getGrowthMetrics(customerId, startTime, endTime, select, deliveryBatches);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(metrics)}`);
    res.ok(metrics);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * Func recals orders,
 *
 * @param {Object} req
 * @param {Object} res
 */
// eslint-disable-next-line consistent-return
const recalculateOrderTotal = async (req, res) =>
  res.notFound("Legacy API, unused routes");
// const { user: { id, role } } = req;
// const logIdentifier = `API version: V1,
// context: OrderController.recalculateOrderTotal(),
// UserId: ${id},
// Role: ${role},`;
// try {
//   const { orderIds } = req.allParams();
//   sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
//   if (orderIds.length) {
//     const ordersBatches = [];
//     while (orderIds.length > 0) {
//       const chunk = orderIds.splice(0, 100);
//       ordersBatches.push(chunk);
//     }
//     const sleep = () => new Promise(resolve => {
//       setTimeout(() => resolve(true), 200);
//     });
//     const result = [];
//     for (const batch of ordersBatches) {
//       result.push(await Promise.all(batch.map(orderId => fixOrderTotal((orderId)))));
//       await sleep();
//     }
//     return res.ok({ result, message: ORDER_STATUS_UPDATED() });
//   }
//   res.error("No orderIds provided");
// } catch (error) {
//   sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
//   res.error(error);
// }

/**
 * BULK EXPIRE COUPONS
 */
const bulkExpireCoupons = async (req, res) =>
  res.notFound("Legacy API, unused routes");
// const { user: { id, role } } = req;
// const { couponNameList } = req.allParams();
// const logIdentifier = `API version: V1, context: BULK EXPIRE COUPONS, UserId: ${id}, Role: ${role},`;
// sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
// try {
//   const result = expireCoupons(couponNameList);
//   res.ok(result);
// } catch (error) {
//   sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
//   res.error(error);
// }

const getCategoriesDgmvByCustomerId = async (req, res) => {
  const { user: { id, role } } = req;
  const { customerIds, categoryIds, startTime, endTime } = req.allParams();
  const logIdentifier = `API version: V1, context: OrderController.getCategoriesDgmvByCustomerId(), ` +
    `CustomerId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const DGMV = await getCategoriesDgmvByCustomerIds(customerIds, categoryIds, startTime, endTime);
    res.ok(DGMV);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * The function takes the req and the res and created the order.
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Array} order
 */
const createSpotOrder = async (req, res) => {
  const {
    body,
    user,
    user: { id, role },
    headers,
    query: { validateDeliveryTime = false },
  } = req;
  const logIdentifier = `API version: V1, context: OrderController.createSpotOrder(), UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with body -> ${JSON.stringify(body)}`);
    const { products, batchId } = body;
    await validateSpotProducts(products, batchId);
    const { order } = await placeOrder(
      body,
      {
        ...user,
        clientTimeOffset: headers.clienttimeoffset,
        language: headers.language,
      },
      headers[DeviceId],
      headers[AppVersion],
      id,
      validateDeliveryTime,
    );
    const { orderItems, orderType, totalPrice } = await findOrderByIdAndPopulateItems(order[0].orderId);
    // Update the order status to packed(4) for spot-sale
    await updateOrderStatusPortal(PACKED, order[0].orderId, null, orderItems, id, role, orderType);
    // For batch assigning to new order
    await assignOrderToBatch(order[0].orderId, body.batchId);
    await Order.updateAndCreateHistory(
      { id: order[0].orderId },
      {
        status_id: IN_TRANSIT,
      },
      id,
      Constants.HyprRoles.getKeyFromValue(6),
      body.batchId,
    );
    await updateOrderStatusLogistics(DELIVERED,
      order[0].orderId,
      null,
      orderItems,
      totalPrice,
      null,
      headers[AppVersion],
      id,
      role,
    );
    const responseOptions = {
      userMessage: ORDER_CREATED(),
    };
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(order)}`);
    return res.ok(order, responseOptions);
  } catch (error) {
    sails.log.error(`Error -> ${JSON.stringify(error.stack || error)}`);
    return res.error(error);
  }
};

/**
 * The function takes the req and the res and return the order.
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Object} order
 */
const getOrderExternalResource = async (req, res) => {
  const { id } = req.allParams();
  const logIdentifier = `API version: V1, context: OrderController.getOrderExternalResource(), ` +
    `OrderId: ${id}`;
  try {
    const order = await getOrderById(id);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(order)}`);
    res.ok(order);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * The function takes the req and the res and returns products in an order.
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Object[]} order items
 */
const fetchOrderItems = async (req, res) => {
  const { id } = req.allParams();
  const logIdentifier = `API version: V1, context: OrderController.fetchOrderItems(), ` +
    `OrderId: ${id}`;
  try {
    const orderItems = await getOrderItems(id);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(orderItems)}`);
    res.ok(orderItems);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};


module.exports = {
  create,
  getOrder,
  getOrders,
  updateStatusLogistic,
  updateStatusPortal,
  recalculateOrderTotal,
  bulkExpireCoupons,
  updateOrderPaymentType,
  findOrderPaymentType,
  findLatestOrderByCustomerId,
  updateStatusConsumer,
  getGrowthOrderMetrics,
  getCategoriesDgmvByCustomerId,
  createSpotOrder,
  getOrderExternalResource,
  fetchOrderItems,
};

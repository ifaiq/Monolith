const { ORDER_STATES } = require("../../Order/Constants");

/**
 * Purpose of these functions is to calculate the performance matrix
 * of a flash-agent agianst a single batch.
 * @param {Order} order
 * @returns {Object}
 */
const calculateGmv = order => {
  let deliveredAmount = 0.0;
  let totalAmount = 0.0;
  if (!order?.items) {
    return { deliveredAmount, totalAmount };
  }
  order.items.forEach(item => {
    totalAmount = totalAmount + (item.originalQuantity * item.price);
    if (order.statusId === ORDER_STATES.DELIVERED || order.statusId === ORDER_STATES.PARTIAL_DELIVERED) {
      deliveredAmount = deliveredAmount + (item.quantity * item.price);
    }
  });
  return { deliveredAmount, totalAmount };
};

/**
 * Calculates the batch performance
 * @param {Order[]} orders
 * @returns {Object}
 */
const calculateBatchPerformace = async orders => {
  if (!orders) {
    return;
  }
  const totalOrders = orders.length;
  let deliveredOrders = 0;
  let deliveredGmv = 0.0;
  let totalGmv = 0.0;
  const totalTouchPoints = [];
  const deliveredTouchPoints = [];
  orders.forEach(order => {
    if (!totalTouchPoints.includes(order.customerId)) totalTouchPoints.push(order.customerId);
    if ([ORDER_STATES.DELIVERED, ORDER_STATES.PARTIAL_DELIVERED].includes(order.statusId)) {
      deliveredOrders = deliveredOrders + 1;
      if (!deliveredTouchPoints.includes(order.customerId)) deliveredTouchPoints.push(order.customerId);
    }
    const { deliveredAmount, totalAmount } = calculateGmv(order);
    deliveredGmv = deliveredGmv + deliveredAmount;
    totalGmv = totalGmv + totalAmount;
  });
  // eslint-disable-next-line consistent-return
  return {
    deliveredGmv,
    deliveredOrders,
    deliveredTouchPointsCount: deliveredTouchPoints?.length,
    totalOrders,
    totalGmv,
    totalTouchPointsCount: totalTouchPoints?.length,
    gmvReliability: Math.round(deliveredGmv / totalGmv * 100),
    orderReliability: Math.round(deliveredOrders / totalOrders * 100),
  };
};

module.exports = {
  calculateBatchPerformace,
};

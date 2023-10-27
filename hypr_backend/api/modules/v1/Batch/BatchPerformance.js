// Didn't import OrderService in BatchService because it was causing circular dependency
const orderDao = require("../Order/OrderDao");
const orderItemDao = require("../Order/OrderItemsDao");

/**
 * This function takes the id and return order.
 *
 * @param {Number} id
 * @returns {Object} order
 */
const findOrder = async id => await orderDao.find(id);

/**
 * This function takes the criteria and return order items.
 *
 * @param {Object} criteria
 * @param {Number} skip
 * @param {Number} limit
 * @returns {OrderItem[]} orderItem
 */
const findOrderItems = async criteria => await orderItemDao.findAll(criteria);

/**
 * Fetch order items against the batch orders
 * @param {BatchOrders[]} batchOrders
 * @returns {OrderItems[]}
 */
const fetchOrderItemsOfBatches = async batchOrders => await Promise.all(batchOrders.map(
  batchOrder => findOrderItems({ orderId: batchOrder.orderId }),
));

/**
 * Fetch orders against the batch orders
 * @param {BatchOrders[]} batchOrders
 * @returns {Order[]}
 */
const fetchOrdersOfBatches = async batchOrders => await Promise.all(batchOrders.map(
  batchOrder => findOrder(batchOrder.orderId),
));

module.exports =
{
  fetchOrderItemsOfBatches,
  fetchOrdersOfBatches,
};

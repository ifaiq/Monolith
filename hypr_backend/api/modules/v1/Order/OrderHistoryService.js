const orderHistoryDao = require("./OrderHistoryDao");
const camelcaseKeys = require("camelcase-keys");

/**
 * This function takes the id and return order history.
 *
 * @param {Number} id
 * @returns {Object} orderHistory
 */
const findOrderHistoryByCheckedId = async id => await orderHistoryDao.findByCheckedId(id);

/**
 * This function takes the orderId and return order history of an order.
 *
 * @param {Number} orderId
 * @returns {OrderHistories[]} orderHistories
 */
const findOrderHistories = async orderId => await orderHistoryDao.findAll(orderId);

/**
 * This function takes the orderHistory and return new orderHistory.
 *
 * @param {Object} orderHistory
 * @param connection
 * @returns {Object} orderHistory
 */
const createOrderHistory = async (
  orderHistory, connection = null,
) => await orderHistoryDao.create(orderHistory, connection);

/**
 * This function takes the id, orderHistory and return updated orderHistory.
 *
 * @param {Number} id
 * @param {Object} orderHistory
 * @returns {Object} orderHistory
 */
const updateOrderHistory = async (id, orderHistory) => await orderHistoryDao.update(id, orderHistory);

/**
 * This function takes the orderID, and returns the order state at the time of order placement
 *
 * @param {Number} orderId
 * @returns {Object} order
 */
const getOrderInitialState = async orderId => {
  const reservedOrder = await orderHistoryDao.findOldestByCriteria({
    orderId,
    statusId: Constants.HyprOrderStates.RESERVED,
  });
  let orderHistory;
  try {
    orderHistory = camelcaseKeys(JSON.parse(reservedOrder.newOrderJson));
  } catch (error) {
    sails.log.error(
      `OrderHistoryService.getOrderInitialState error: failed to get orderHistory. Details: ${JSON.stringify(error)}`);
    const order = await orderHistoryDao.findOldestByCriteria({
      orderId,
    });
    orderHistory = camelcaseKeys(JSON.parse(order.newOrderJson));
  }

  return orderHistory;
};

module.exports = {
  findOrderHistoryByCheckedId,
  findOrderHistories,
  createOrderHistory,
  updateOrderHistory,
  getOrderInitialState,
};

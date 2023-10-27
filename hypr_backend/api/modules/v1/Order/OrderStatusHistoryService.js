const orderStatusHistoryDao = require("./OrderStatusHistoryDao");

/**
 * This function takes the id and return order status history.
 *
 * @param {Number} id
 * @returns {Object} orderStatusHistory
 */
const findOrderStatusHistoryByCheckedId = async id => await orderStatusHistoryDao.findByCheckedId(id);

/**
 * This function takes the orderId and return order status history of an order.
 *
 * @param {Number} orderId
 * @returns {OrderStatusHistories[]} orderStatusHistories
 */
const findOrderStatusHistories = async orderId => await orderStatusHistoryDao.findAll(orderId);

/**
 * This function takes the orderStatusHistory and return new orderStatusHistory.
 *
 * @param {Object} orderStatusHistory
 * @returns {Object} orderStatusHistory
 */
const createOrderStatusHistory = async orderStatusHistory => await orderStatusHistoryDao.create(orderStatusHistory);

/**
 * This function takes the id, orderStatusHistory and return updated orderStatusHistory.
 *
 * @param {Number} id
 * @param {Object} orderStatusHistory
 * @returns {Object} orderStatusHistory
 */
const updateOrderStatusHistory = async (id, orderStatusHistory) =>
  await orderStatusHistoryDao.update(id, orderStatusHistory);

module.exports = {
  findOrderStatusHistoryByCheckedId,
  findOrderStatusHistories,
  createOrderStatusHistory,
  updateOrderStatusHistory,
};

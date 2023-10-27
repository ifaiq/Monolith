const { errors: { ORDER_STATUS_HISTORY_NOT_FOUND } } = require("./Errors");
const camelcaseKeys = require("camelcase-keys");


/**
 * This function takes the orderId and return order status history against order id.
 *
 * @param {Number} orderId
 * @returns {OrderStatusHistories[]} order status histories
 */
const findAll = async orderId => await OrderStatusHistory.find({ order_id: orderId });

/**
 * This function takes the id, order status history and returns updated order status history.
 *
 * @param {Number} id
 * @param {Object} orderStatusHistory
 * @returns {Object} order status history
 */
const update = async (id, orderStatusHistory) => await OrderStatusHistory.updateOne({ id }, orderStatusHistory);

/**
 * This function takes the order status history and return new order status history object.
 *
 * @param {Object} orderStatusHistory
 * @returns {Object} order status history
 */
const create = async orderStatusHistory => await OrderStatusHistory.create(orderStatusHistory);

/**
 * This function takes the id and return order status history.
 *
 * @param {Number} id
 * @returns {Object} order history
 */
const findByCheckedId = async id => {
  const orderStatusHistory = await OrderStatusHistory.findOne({ id });
  if (_.isEmpty(orderStatusHistory)) {
    throw ORDER_STATUS_HISTORY_NOT_FOUND();
  }
  return camelcaseKeys(orderStatusHistory);
};
module.exports = {
  findAll,
  create,
  update,
  findByCheckedId,
};

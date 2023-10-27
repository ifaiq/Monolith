const { errors: { ORDER_HISTORY_NOT_FOUND } } = require("./Errors");
const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const { HyprOrderStates: { SALE_ORDER } } = require("../../../services/Constants");

/**
 * This function takes the orderId and return order history against order id.
 *
 * @param {Number} orderId
 * @returns {OrderHistories[]} order histories
 */
const findAll = async orderId =>
  camelcaseKeys(
    await OrderHistory.find({
      order_id: orderId,
      status_id: { ">": SALE_ORDER },
    }).select(["status_id", "created_at"]),
    { deep: true },
  );

/**
 * This function takes the id, order history object and returns updated order history object.
 *
 * @param {Number} id
 * @param {Object} orderHistory
 * @returns {Object} order history
 */
const update = async (id, orderHistory) => await OrderHistory.updateOne({ id }, orderHistory);

/**
 * This function takes the orderHistory and return new order history object.
 *
 * @param {Object} orderHistory
 * @param connection
 * @returns {Object} order history
 */
const create = async (orderHistory, connection = null) => {
  let updatePromise = OrderHistory.create(orderHistory);
  if (connection) {
    updatePromise = updatePromise.usingConnection(connection);
  }
  return updatePromise;
};

/**
 * This function takes the id and return order history.
 *
 * @param {Number} id
 * @returns {Object} order history
 */
const findByCheckedId = async id => {
  const orderHistory = await OrderHistory.findOne({ id });
  if (_.isEmpty(orderHistory)) {
    throw ORDER_HISTORY_NOT_FOUND();
  }
  return camelcaseKeys(orderHistory);
};

/**
 * This function takes the criteria and returns the oldest order history
 *
 * @param {Number} criteria
 * @returns {OrderHistory} order history
 */
const findOldestByCriteria = async criteria => {
  const orderHistories = await OrderHistory.find(snakecaseKeys(criteria))
    .sort("created_at")
    .limit(1);
  return camelcaseKeys(orderHistories[0], { deep: true });
};

module.exports = {
  findAll,
  create,
  update,
  findByCheckedId,
  findOldestByCriteria,
};

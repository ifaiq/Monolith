const { errors: { ORDER_ITEM_NOT_FOUND } } = require("./Errors");
const { getLanguage } = require("../../../../utils/languageAccessor");
const snakecaseKeys = require("snakecase-keys");
const camelcaseKeys = require("camelcase-keys");
const productDao = require("../Product/ProductDao");

/**
 * This function takes the id and return orderItem.
 *
 * @param {Number} id
 * @returns {Object} orderItem
 */

const findByCheckedId = async id => {
  const order = await OrderItems.findOne({ id });
  if (_.isEmpty(order)) {
    throw ORDER_ITEM_NOT_FOUND();
  }
  return order;
};

/**
 * This function takes the id and return order item.
 *
 * @param {Number} id
 * @returns {Object} order item
 */
const find = async id => await findByCheckedId(id);

/**
 * This function takes the skip, limit and return order items.
 *
 * @param {Number} skip
 * @param {Number} limit
 * @returns {OrderItems[]} orders items
 */
const findAll = async (criteria, skip, limit) => {
  const orderItems = await OrderItems.find(snakecaseKeys(criteria)).skip(skip).limit(limit);
  return camelcaseKeys(orderItems);
};

/**
 * This function takes the criteria and return order item count.
 *
 * @param {Object} criteria
 * @returns {Number} total order items
 */
const count = async criteria => await OrderItems.count(criteria);

/**
 * This function takes the id, orderItem and return updated orderItem.
 *
 * @param {Number} id
 * @param {Object} orderItem
 * @returns {Object} orderItem
 */
const update = async (id, orderItem, connection = null) => {
  const orderItemSnakeKeys = snakecaseKeys(orderItem);
  let updatePromise = OrderItems.updateOne({ id }, orderItemSnakeKeys);
  if (connection) {
    updatePromise = updatePromise.usingConnection(connection);
  }
  await updatePromise;
};

/**
 * This function takes the orderItem and return new orderItem.
 *
 * @param {Object} orderItem
 * @returns {Object} orderItem
 */
const create = async orderItem => await OrderItems.create(orderItem);

/**
 *
 * @param {*} orderIds
 * @returns orderItems with the associated products
 * This function is intended to replace the usage of original function findByOrderIdAndPopulateProduct
 */
const findByOrderIdAndPopulateProduct = async orderIds => {
  const orderItems = await OrderItems.find({ order_id: orderIds });
  const productIds =  orderItems.map(item => item.product_id);
  const products = await productDao.findManyByIdsWithCriteria(productIds, {
    language: getLanguage(),
  });
  for (const item of orderItems) {
    const product = products.find(itemProduct => itemProduct.id === item.product_id);
    if(product) {
      item.product_id =  product;
    }
  }

  return camelcaseKeys(orderItems, { deep: true });
};
module.exports = {
  findAll,
  create,
  update,
  count,
  find,
  findByOrderIdAndPopulateProduct,
};

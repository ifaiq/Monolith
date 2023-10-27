const orderItemDao = require("./OrderItemsDao");
const {
  productService:
  {
    findProductNameLanguagesAR,
  },
} = require("../Product");

/**
 * This function takes the id and return order item.
 *
 * @param {Number} id
 * @returns {Object} orderItem
 */
const findOrderItem = async id => await orderItemDao.find(id);

/**
 * This function takes the skip, limit and return order items.
 *
 * @param {Object} criteria
 * @param {Number} skip
 * @param {Number} limit
 * @returns {OrderItem[]} orderItem
 */
const findOrderItems = async (criteria, skip, limit) => await orderItemDao.findAll(criteria, skip, limit);

/**
 * This function takes the orderItem and return new orderItem.
 *
 * @param {Object} orderItem
 * @returns {Object} orderItem
 */
// eslint-disable-next-line no-async-promise-executor
const createOrderItem = orderItem => new Promise(async (resolve, reject) => {
  try {
    const createdOrderItem = await orderItemDao.create(orderItem);
    if (createdOrderItem) {
      resolve({ product: createdOrderItem, success: true });
    } else {
      resolve({ product: createdOrderItem, success: false, error: "criteria hard to fill" });
    }
  } catch (err) {
    sails.log.error(
      `OrderItemService.createOrderItem(), Resolving with failed Order Item: ${JSON.stringify(
        orderItem,
      )}, Error -> ${JSON.stringify(err)}`,
    );

    reject({ orderItem: orderItem, success: false, error: err });
  }
});


/**
 * This function takes the criteria and return order item count.
 *
 * @param {Object} criteria
 * @returns {Number} orderItem total
 */
const countOrderItems = async criteria => await orderItemDao.count(criteria);

/**
 * This function takes the id, orderItem and return updated orderItem.
 *
 * @param {Number} id
 * @param {Object} orderItem
 * @returns {Object} orderItem
 */
const updateOrderItem = async (id, orderItem) => await orderItemDao.update(id, orderItem);

/**
 * This function takes the orderId and return populated orderItem.
 *
 * @param {Object} orderId
 * @returns {Object} orderItem
 */
const findOrderItemsByOrderId = async orderId => await orderItemDao.findByOrderIdAndPopulateProduct(orderId);

// This function is more optimized than findOrderItemsByOrderId so this should be used.
const findOrderItemsByOrderIdAndPopulate = async orderId => {
  const orderItems = await orderItemDao.findAll({ orderId });
  const productIds = orderItems.map(orderItem => orderItem.productId);
  const languages = await findProductNameLanguagesAR(productIds);
  for (const language of languages) {
    for (const item of orderItems) {
      if (item.productId === language.productId) item.multilingual = language;
    }
  }
  return orderItems;
};

module.exports = {
  findOrderItem,
  findOrderItems,
  createOrderItem,
  countOrderItems,
  updateOrderItem,
  findOrderItemsByOrderId,
  findOrderItemsByOrderIdAndPopulate,
};

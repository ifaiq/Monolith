const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");


/**
 * This function takes the criteria, skip, limit and return batches.
 *
 * @param {Object} criteria
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Batches[]} batches
 */
const findAll = async (criteria, skip, limit) =>
  (
    await DeliveryBatchOrder.find(snakecaseKeys(criteria))
      .skip(skip)
      .limit(limit)
  ).map(camelcaseKeys);

/**
 * This function takes the orderId and returns latest batch.
 *
 * @param {Number} orderId
 * @returns {Object} batch
 */
const findLatestByOrderId = async orderId =>
  (
    await DeliveryBatchOrder.find(snakecaseKeys({ orderId }))
      .sort("batch_id DESC")
      .limit(1)
  ).map(camelcaseKeys)[0];

const findBatchDetailsByOrderId = async  orderId =>
  (
    await DeliveryBatchOrder.find(snakecaseKeys({ orderId })).populate("batch_id").select("batch_id")
  ).map(camelcaseKeys)[0];

const createDeliveryBatchOrder = async (orderId, batchId) =>
  (
    await DeliveryBatchOrder.create(({ order_id: orderId, batch_id: batchId }))
  );

module.exports = {
  findAll,
  findLatestByOrderId,
  findBatchDetailsByOrderId,
  createDeliveryBatchOrder,
};

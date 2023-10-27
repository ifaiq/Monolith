const { errors: { BATCH_NOT_FOUND } } = require("./Errors");
const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");

/**
 * This function takes the skip, limit and return batches.
 *
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Batches[]} batches
 */
const findAll = async (skip, limit) => await DeliveryBatch.find().skip(skip).limit(limit);

/**
 * This function takes the criteria and return batch count.
 *
 * @param {Object} criteria
 * @returns {Number} total batches
 */
const count = async criteria => await DeliveryBatch.count(criteria);

/**
 * This function takes the id, batch and return updated batch.
 *
 * @param {Number} id
 * @param {Object} batch
 * @param connection
 * @returns {Object} batch
 */
const update = async (id, batch, connection = null) => {
  let updatePromise = DeliveryBatch.updateOne({ id }, snakecaseKeys(batch, { deep: true }));
  if (connection) {
    updatePromise = updatePromise.usingConnection(connection);
  }
  return await updatePromise;
};

/**
 * This function takes the batch and return new batch.
 *
 * @param {Object} batch
 * @returns {Object} batch
 */
const create = async order => await DeliveryBatch.create(batch);

/**
 * This function takes the id and return batch.
 *
 * @param {Number} id
 * @returns {Object} batch
 */
const findByCheckedId = async id => {
  const deliveryBatch = await DeliveryBatch.findOne({ id });
  if (_.isEmpty(deliveryBatch)) {
    throw BATCH_NOT_FOUND();
  }
  return camelcaseKeys(deliveryBatch);
};

/**
 * This function takes the criteria and return batch.
 *
 * @param {Number} criteria
 * @returns {Object} batch
 */
const findByCriteria = async criteria => {
  const deliveryBatch = await DeliveryBatch.find(snakecaseKeys(criteria));
  if (_.isEmpty(deliveryBatch)) {
    throw BATCH_NOT_FOUND();
  }
  return camelcaseKeys(deliveryBatch[0]);
};

const findManyByCriteria = async criteria => {
  const deliveryBatch = await DeliveryBatch.find(criteria).populate("rtg_status_id");
  if (_.isEmpty(deliveryBatch)) {
    throw BATCH_NOT_FOUND();
  }
  return camelcaseKeys(deliveryBatch);
};

/**
 * This function takes the skip, limit and return batches.
 *
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Batches[]} batches
 */
const findByIds = async batchIds => camelcaseKeys(await DeliveryBatch.find({ id: { in: batchIds } }));

module.exports = {
  findAll,
  create,
  update,
  count,
  findByCheckedId,
  findByCriteria,
  findByIds,
  findManyByCriteria,
};

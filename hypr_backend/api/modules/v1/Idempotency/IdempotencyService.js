const { create: createIdempotencyEntity, findByIdempotencyKey } = require("./IdempotencyDao");

/**
 * This function takes the data and return new idempotency entity.
 *
 * @param {Object} data
 * @returns {Object} Idempotency
 */
const createIdempotency = async (data, connection = null) => await createIdempotencyEntity(data, connection);

module.exports = {
  createIdempotency,
  findByIdempotencyKey,
};

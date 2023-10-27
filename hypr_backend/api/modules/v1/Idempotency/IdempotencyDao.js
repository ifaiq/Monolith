const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");

/**
 * This function takes the invoice and return new invoice.
 *
 * @param {Object} data
 * @returns {Object} response
 */
const create = async (data, connection = null) => {
  if (connection) {
    return await Idempotency.create(snakecaseKeys(data)).usingConnection(connection);
  }
  return await Idempotency.create(snakecaseKeys(data));
};

/**
 * This function takes the id and return invoice.
 *
 * @param {String} idempotencyKey
 * @returns {Object} response
 */
const findByIdempotencyKey = async idempotencyKey => camelcaseKeys(
  await Idempotency.findOne(snakecaseKeys({ idempotencyKey })),
);

module.exports = {
  create,
  findByIdempotencyKey,
};

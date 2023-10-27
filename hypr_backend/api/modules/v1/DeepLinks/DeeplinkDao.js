// const camelcaseKeys = require("camelcase-keys");
/**
 * This function takes the order and return new order.
 *
 * @param {Object} deeplinkParameters
 * @returns {Object} order
 */
const create = async deeplinkParameters => await DeeplinkEvent.create(deeplinkParameters);

module.exports = { create };

const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");

/**
 * This function takes the data and returns new entry for batch history.
 *
 * @param {Object} data
 * @returns {Object} response
 */
const create = async (data, connection = null) => {
  const historyData = _.cloneDeep(data);
  if(typeof(historyData.oldJSON.products) === "string") {
    historyData.oldJSON.products = JSON.parse(historyData.oldJSON.products);
  }
  if(typeof(historyData.newJSON.products) === "string") {
    historyData.newJSON.products = JSON.parse(historyData.newJSON.products);
  }
  const history = {
    batch_id: historyData?.batchId,
    type: historyData?.type,
    new_JSON: historyData?.newJSON,
    old_JSON: historyData?.oldJSON,
    old_status_id: historyData?.oldJSON?.status_id || historyData?.oldJSON?.statusId || null,
    new_status_id: historyData?.newJSON?.status_id || historyData?.newJSON?.statusId || null,
  };
  if (connection) {
    return await BatchHistory.create(history).usingConnection(connection);
  }
  return await BatchHistory.create(history);
};

/**
 * This function takes the batch id and returns batch history.
 *
 * @param {Number} batchId
 * @returns {Object} response
 */
const findByBatchId = async batchId => camelcaseKeys(
  await BatchHistory.findOne(snakecaseKeys({ batchId })),
);

module.exports = {
  create,
  findByBatchId,
};

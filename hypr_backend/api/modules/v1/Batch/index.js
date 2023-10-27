// TODO in every index of module use deafult import
const BatchRoutes = require("./BatchRoutes");
const { addPrefixWithRoutes } = require("../../../../utils/routes");
const { constants: { request: { VERSIONING: { v1, prefix } } } } = require("../../../constants/http");
const batchService = require("./BatchService");
const { BATCH_STATES, BATCH_HISTORY_TYPES } = require("./Constants");
const batchValidation = require("./BatchJoiValidation");


module.exports = {
  batchRoutes: addPrefixWithRoutes(`/${prefix}/${v1}/batch`, BatchRoutes),
  batchService,
  // TODO will move in global constants
  BATCH_STATES,
  BATCH_HISTORY_TYPES,
  batchValidation,
};

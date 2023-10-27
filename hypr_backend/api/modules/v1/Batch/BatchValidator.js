const { BATCH_STATES: { CLOSED, COMPLETED } } = require("./Constants");
const { errors: { INVALID_BATCH_STATUS } } = require("./Errors");

/**
 * Function validates if batch status is correct throw an error
 * @param {Number} endStatus
 * @param {Number} currentStatus
 * @returns {Boolean} isValid
 */
const validateBatchStatus = (currentStatus, endStatus) => {
  let isValid = false;
  switch (currentStatus) {
    case COMPLETED:
      if (endStatus && endStatus === CLOSED) {
        sails.log.info(currentStatus, endStatus);
        isValid = true;
        break;
      }
    // eslint-disable-next-line no-fallthrough
    default:
      throw INVALID_BATCH_STATUS();
  }
  return isValid;
};

/**
 * Function validates if the batch status of order is closed
 * @param {Number} orderId
 */
const validateBatchClosed = status => {
  if (status !== CLOSED) {
    throw INVALID_BATCH_STATUS();
  }
};

module.exports = {
  validateBatchStatus,
  validateBatchClosed,
};

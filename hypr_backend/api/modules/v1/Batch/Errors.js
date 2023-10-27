const errors = {

  BATCH_NOT_FOUND: () => ({
    code: 1801,
    message: sails.__("BATCH_NOT_FOUND"),
  }),
  INVALID_DIFFERENCE_REASON: () => ({
    code: 1802,
    message: sails.__("INVALID_DIFFERENCE_REASON"),
  }),
  INVALID_RETURN_REASON: () => ({
    code: 1803,
    message: sails.__("INVALID_RETURN_REASON"),
  }),
  INVALID_NON_CASH_TYPE: () => ({
    code: 1804,
    message: sails.__("INVALID_NON_CASH_TYPE"),
  }),
  INVALID_BATCH_STATUS: () => ({
    code: 1805,
    message: sails.__("INVALID_BATCH_STATUS"),
  }),
  BATCH_STATUS_CLOSED: () => ({
    code: 1806,
    message: sails.__("BATCH_STATUS_CLOSED"),
  }),

};
module.exports = { errors };

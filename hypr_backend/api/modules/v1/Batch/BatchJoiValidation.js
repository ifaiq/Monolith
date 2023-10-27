const { Joi } = require("../../../../utils/services");
const { validateDifferenceReason, validateReturnReason, validateNonCashType } = require("./Utils");
const {
  errors:
    { INVALID_DIFFERENCE_REASON,
      INVALID_RETURN_REASON,
      INVALID_NON_CASH_TYPE,
    } } = require("./Errors");

const putBatchValidation = Joi.object()
  .keys({
    body: Joi.object({
      cashCollected: Joi.number().min(0).strict().required(),
      nonCashCollected: Joi.number().min(0).strict().required(),
      differenceReason: Joi.number().integer().positive().custom(differenceReason => {
        const isValidValue = validateDifferenceReason(differenceReason);
        if (!isValidValue) {
          throw new Error(INVALID_DIFFERENCE_REASON().message);
        }
        return differenceReason;
      }).strict(),
      nonCashType: Joi.number().integer().positive().custom(nonCashType => {
        const isValidValue = validateNonCashType(nonCashType);
        if (!isValidValue) {
          throw new Error(INVALID_NON_CASH_TYPE().message);
        }
        return nonCashType;
      }).strict(),
      products: Joi.array().items(
        Joi.object({
          id: Joi.number().integer().positive().strict().required(),
          returnQuantity: Joi.number().integer().strict().required(),
          returnReason: Joi.number().integer().positive().custom(returnReason => {
            const isValidValue = validateReturnReason(returnReason);
            if (!isValidValue) {
              throw new Error(INVALID_RETURN_REASON().message);
            }
            return returnReason;
          }).strict(),
        }).unknown(true),
      ),

    }).unknown(true),
    params: {
      id: Joi.string().pattern(/^[0-9]/).required(),
    },
  });

const getOrdersByBatchValidation = Joi.object()
  .keys({
    params: {
      id: Joi.string().pattern(/^[0-9]/).required(),
      customerId: Joi.string().pattern(/^[0-9]/).optional(),
    },
  });
const getSpotProductsValidation = Joi.object()
  .keys({
    query: Joi.object({
      batchId: Joi.number().integer().min(1).required(),
    }).unknown(true),
  });

const getBatchStatusValidation = Joi.object()
  .keys({
    query: Joi.object({
      batchId: Joi.number().integer().min(1).required(),
    }).unknown(true),
  });

const getRtgCompletedValidation = Joi.object()
  .keys({
    params: {
      agentId: Joi.string().pattern(/^[0-9]/).required(),
    },
  });

const getBatchIdValidation = Joi.object()
  .keys({
    params: {
      batchId: Joi.string().pattern(/^[0-9]/).required(),
    },
  });

const putBatchRtgStatusValidation = Joi.object()
  .keys({
    body: Joi.object({
      agentId: Joi.number().integer().positive().strict().required(),
      startTime: Joi.date().optional(),
      products: Joi.array().items(
        Joi.object({
          id: Joi.number().integer().positive().strict().required(),
          receivedQuantity: Joi.number().integer().min(0).strict().required(),
          missingQuantity: Joi.number().integer().min(0).strict().required(),
          damages: Joi.number().integer().min(0).strict().required(),
        }).unknown(true),
      ),
    }).unknown(true),
    params: {
      batchId: Joi.string().pattern(/^[0-9]/).required(),
    },
  });
const batchRtgUnassignValidation = Joi.object()
  .keys({
    body: Joi.object({
      agentId: Joi.number().integer().positive().strict(),
    }).unknown(true),
    params: {
      batchId: Joi.string().pattern(/^[0-9]/).required(),
    },
  });
const batchRtgAssignValidation = Joi.object()
  .keys({
    body: Joi.object({
      agentId: Joi.number().integer().positive().strict().required(),
    }).unknown(true),
    params: {
      batchId: Joi.string().pattern(/^[0-9]/).required(),
    },
  });
const saveCashClosingValidation = Joi.object()
  .keys({
    query: Joi.object({
      productName: Joi.string(),
    }).unknown(true),
    params: {
      batchId: Joi.string().pattern(/^[0-9]/).required(),
    },
  });
const attachSaveInBatchValidation = Joi.object()
  .keys({
    query: Joi.object({
      file: Joi.string(),
    }).unknown(true),
  });
const getCashClosingValidation = Joi.object()
  .keys({
    params: {
      batchId: Joi.string().pattern(/^[0-9]/).required(),
    },
  });
const getsearchProductsInBatchValidation = Joi.object()
  .keys({
    query: Joi.object({
      productName: Joi.string().required(),
    }).unknown(true),
    params: {
      batchId: Joi.string().pattern(/^[0-9]/).required(),
    },
  });

module.exports = {
  putBatchValidation,
  getOrdersByBatchValidation,
  getSpotProductsValidation,
  getBatchStatusValidation,
  getRtgCompletedValidation,
  getCashClosingValidation,
  getBatchIdValidation,
  putBatchRtgStatusValidation,
  getsearchProductsInBatchValidation,
  saveCashClosingValidation,
  batchRtgUnassignValidation,
  batchRtgAssignValidation,
  attachSaveInBatchValidation,
};

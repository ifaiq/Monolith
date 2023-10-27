/* eslint-disable no-fallthrough */
const { MIN_ORDER_LIMIT } = require("./Constants");
const {
  errors: {
    ORDER_TOTAL_LESS_THAN_MIN_LIMIT,
    ORDER_TOTAL_MORE_THAN_MAX_LIMIT,
    INVALID_ORDER_STATUS,
    MISSING_ORDER_ITEMS,
    MISSING_CUSTOMER_ID,
    INVALID_CUSTOMER_LOCATION,
  },
} = require("./Errors");
const {
  ORDER_STATES: {
    RESERVED,
    PACKED,
    IN_TRANSIT,
    PARTIAL_DELIVERED,
    DELIVERED,
    CANCELLED,
    ON_HOLD,
  },
} = require("./Constants");
const { BATCH_STATES: { PENDING, ACCEPTED, COMPLETED, CLOSED } } = require("../Batch");
const { errors: { WAIVER_MISSING } } = require("../Waiver");
const { fetchLoanSummary, orderIsInCreditBuyLimit } = require(`../LMS`);
const { getRetailerEligibilityAndBalance } = require("../Wallet");

/**
 * Function takes the grandTotal, minOrderLimit, maxOrderLimit to validation order.
 * @param {Array} grandTotal
 * @param {Number} minOrderLimit
 * @param {Number} maxOrderLimit
 * @returns validationResponses
 */
const validateOrder = (grandTotal, minOrderLimit, maxOrderLimit) => {
  validateTotalBelowLimit(grandTotal, minOrderLimit);
  validateTotalAboveLimit(grandTotal, maxOrderLimit);
};

/**
 *
 * @param {Number} total
 * @param {Number} minOrderLimit
 * @returns {Object} throw error
 */
const validateTotalBelowLimit = (total, minOrderLimit = MIN_ORDER_LIMIT) => {
  if (total < minOrderLimit) {
    throw { data: ORDER_TOTAL_LESS_THAN_MIN_LIMIT() };
  }
};

/**
 *
 * @param {Number} total
 * @param {Number} maxOrderLimit
 * @returns {Object} throw error
 */
const validateTotalAboveLimit = (total, maxOrderLimit) => {
  if (maxOrderLimit && (total > maxOrderLimit)) {
    throw { data: ORDER_TOTAL_MORE_THAN_MAX_LIMIT(maxOrderLimit.toString()) };
  }
};

/**
 * Function validates if order status is in correct state for logistic user
 * @param {Boolean} isBatch
 * @param {Number} batchCurrentStatus
 * @param {Number} endStatus
 * @param {Number} currentStatus
 * @returns {Boolean} isValid
 */
const validateOrderStatusLogistic = (isBatch, batchCurrentStatus, endStatus, currentStatus) => {
  isValid = false;
  switch (currentStatus) {
    case IN_TRANSIT:
      if (isBatch &&
        [ACCEPTED, COMPLETED].includes(batchCurrentStatus) &&
        [PARTIAL_DELIVERED, DELIVERED, CANCELLED, ON_HOLD].includes(endStatus)) {
        isValid = true;
        break;
      }
    default:
      throw INVALID_ORDER_STATUS();
  }
  return isValid;
};

/**
 * Function validates if order status is in correct state for portal user
 * @param {Boolean} isBatch
 * @param {Number} batchCurrentStatus
 * @param {Number} endStatus
 * @param {Number} currentStatus
 * @returns {Boolean} isValid
 */
const validateOrderStatusPortal = (isBatch, batchCurrentStatus, endStatus, currentStatus, isDeliveryBoyId) => {
  let isValid = false;
  switch (currentStatus) {
    case RESERVED:
      if (!isBatch &&
        [PACKED, CANCELLED, ON_HOLD].includes(endStatus)) {
        isValid = true;
        break;
      }
    case PACKED:
      if (!isBatch &&
        [CANCELLED, ON_HOLD].includes(endStatus)) {
        isValid = true;
        break;
      }
      if (isBatch &&
        batchCurrentStatus === PENDING &&
        endStatus === IN_TRANSIT) {
        isValid = true;
        break;
      }
    case IN_TRANSIT:
      if (isBatch &&
        batchCurrentStatus === PENDING &&
        endStatus === PACKED) {
        isValid = true;
        break;
      }
    case ON_HOLD:
      if (!isBatch &&
        endStatus === PACKED) {
        isValid = true;
        break;
      }
    case PARTIAL_DELIVERED:
    case DELIVERED:
    case CANCELLED:
    // eslint-disable-next-line no-duplicate-case
    case ON_HOLD:
      if (isBatch &&
        isDeliveryBoyId &&
        [ACCEPTED, COMPLETED].includes(batchCurrentStatus) &&
        endStatus === IN_TRANSIT) {
        isValid = true;
        break;
      }
    default:
      throw INVALID_ORDER_STATUS();
  }
  return isValid;
};

/**
 * Function validates if order status is in correct state for consumer/sales agent user ( consumer case )
 * @param {Boolean} isBatch
 * @param {Number} batchCurrentStatus
 * @param {Number} endStatus
 * @param {Number} currentStatus
 * @returns {Boolean} isValid
 */
const validateOrderStatusConsumer = (isBatch, batchCurrentStatus, endStatus, currentStatus) => {
  if (endStatus !== CANCELLED) {
    throw INVALID_ORDER_STATUS();
  }

  let isValid = false;
  switch (currentStatus) {
    case RESERVED:
      if (!isBatch) {
        isValid = true;
        break;
      }
    case ON_HOLD:
      if (!isBatch) {
        isValid = true;
        break;
      } else if (isBatch && batchCurrentStatus === CLOSED) {
        isValid = true;
        break;
      }
    default:
      throw INVALID_ORDER_STATUS();
  }

  return isValid;
};


/**
 * Function validates if order status is in correct state for logistic user
 * @param {Boolean} isBatch
 * @param {Number} batchCurrentStatus
 * @param {Number} endStatus
 * @param {Number} currentStatus
 * @returns {Boolean} isValid
 */
const validateOrderItems = orderItems => {
  // Need to validate the ids of newOrderItems with actual order items
  isValid = false;
  if (_.isEmpty(orderItems)) {
    throw MISSING_ORDER_ITEMS();
  }
};

/**
 * Function validates currentWaiver, waiver from the payload and throw exception
 * @param {Object} currentWaiver
 * @param {Number} waiver
 */
const validateOrderWaiver = (currentWaiver, waiver) => {
  if (!_.isEmpty(currentWaiver) && !waiver) throw WAIVER_MISSING();
};

/**
 * Function validates if order has customerId key and throw exception
 * @param {Object} order
 */
const validateCustomerId = order => {
  if (!Object.prototype.hasOwnProperty.call(order, "customerId")) {
    throw MISSING_CUSTOMER_ID();
  }
};

/**
 * Function validates if order has invalid location key and throw exception
 * @param {Number} currentLocationId
 * @param {Number} locationId
 */
const validateCurrentCustomerLocation = (currentLocationId, locationId) => {
  if (currentLocationId !== locationId) {
    throw { data: INVALID_CUSTOMER_LOCATION() };
  }
};
/**
 * Function validates if order has empty locations throw exception
 * @param {Array} locations
 */
const validateCustomerLocation = locations => {
  if (_.isEmpty(locations)) {
    throw { data: INVALID_CUSTOMER_LOCATION() };
  }
};

/**
 * This function validated credit order and returns grand total with service fee added
 * @param {Number} retailerId
 * @param {Number} grandTotalAmount
 * @param {Number} retailerPhone
 * @param {Number} retailerCnic
 * @returns grandTotal with service fee added
 */
const validateCreditOrderAndGetCreditFee = async (
  retailerId,
  grandTotalAmount,
  retailerPhone,
  retailerCnic,
  currency,
  loanProductId = null,
  productItems,
) => {
  if (orderIsInCreditBuyLimit(grandTotalAmount, currency)) {
    const { eligibility, balance } = await getRetailerEligibilityAndBalance(retailerId);
    const validationResponses = {};
    if (!eligibility) {
      validationResponses.creditEligibilityValidation = {
        code: 2000,
        message: "You are not eligible for credit buy yet",
      };
      throw { data: validationResponses };
    }
    try {
      const loanSummaryRes = await fetchLoanSummary(retailerId, grandTotalAmount, retailerPhone, retailerCnic, null,
        loanProductId, productItems);
      const loanSummary = loanSummaryRes.data.data;
      const grandTotal = loanSummary.specs["Total Payable Before Due Date"];
      creditBuyFee = loanSummary.specs["Markup Amount"];
      if (balance < grandTotal) {
        validationResponses.creditBalanceValidation = {
          code: 2001,
          message: `Your order total: ${grandTotal} exceeds your available loan credit: ${balance}`,
        };
        throw { data: validationResponses };
      }
      if (!orderIsInCreditBuyLimit(grandTotal, currency)) {
        throw {
          data: {
            creditLimitValidation: {
              code: 2002,
              message: `Order total: ${grandTotal} not in creditBuy limits`,
            },
          },
        };
      }
      return creditBuyFee;
    } catch (err) {
      throw err;
    }
  } else {
    throw {
      data: {
        creditLimitValidation: {
          code: 2002,
          message: `Order total: ${grandTotalAmount} not in Creditbuy limits`,
        },
      },
    };
  }
};

module.exports = {
  validateOrder,
  validateOrderStatusLogistic,
  validateOrderStatusPortal,
  validateOrderItems,
  validateOrderWaiver,
  validateCustomerId,
  validateTotalBelowLimit,
  validateTotalAboveLimit,
  validateCustomerLocation,
  validateCurrentCustomerLocation,
  validateCreditOrderAndGetCreditFee,
  validateOrderStatusConsumer,
};

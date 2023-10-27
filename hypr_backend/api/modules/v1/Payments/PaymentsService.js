const { createServiceToken } = require("@development-team20/auth-library/dist");
const { post, put} = require("../../../clients/AxiosClient");

const { errors: {PAYMENTS_SERVICE_ERROR}} = require("./Errors");
// Import Constants
const { URLS: {
  CREATE_TRANSACTION,
  COMPLETE_TRANSACTION,
  CANCEL_TRANSACTION,
  ROLLBACK_TRANSACTION,
  GET_CASH,
  GET_CASH_BATCH,
  GET_SADAD_BREAKDOWN,
  GET_ORDERS_BREAKDOWN,
} } = require("./PaymentsConstants");
const { globalConf } = require("../../../../config/globalConf");
const { PAYMENT_TYPES: { COD_WALLET, SADAD, SADAD_WALLET } } = require("../Order/Constants");
const { getLanguage } = require("../../../../utils/languageAccessor");


/**
 * Function takes order information and returns transaction ids generated on Payments Service
 * @param { Number } retailerId
 * @param { Number } orderId
 * @param { Object } total contains amount and currency
 * @param { String } subtransactionId
 */
const createPaymentsTransaction = async payload => {
  const logIdentifier = `API version: V1, Context: PAYMENTS_SERVICE, createPaymentsTransaction()`;
  sails.log(`${logIdentifier} Entry with params -> ${JSON.stringify(payload)}`);
  if (!_verifyPaymentsIsEnabled()) {
    sails.log.warn(`${logIdentifier} Payments Service feature disabled`);
    return Promise.resolve(true);
  }
  try {
    const createTransactionResponse = await post({
      url: `${CREATE_TRANSACTION}`,
      data: payload,
      headers: {
        language: getLanguage().toLowerCase(),
        Authorization: await createServiceToken(),
      },
    });
    sails.log.info(
      `${logIdentifier} Create transaction call response -> ${JSON.stringify(
        createTransactionResponse,
      )}`,
    );
    return createTransactionResponse.data;
  } catch (error) {
    sails.log.error(
      `${logIdentifier} An error occured while creating transaction -> ${JSON.stringify(error)}`,
    );
    throw PAYMENTS_SERVICE_ERROR();
  }
};

/**
 * Function takes order information and returns transaction ids completed on Payments Service
 * @param { Number } retailerId
 * @param { Number } orderId
 * @param { Object } total contains amount and currency
 * @param { String } subtransactionId
 */
const completePaymentsTransaction = async payload => {
  const logIdentifier = `API version: V1, Context: PAYMENTS_SERVICE, completePaymentsTransaction()`;
  sails.log(`${logIdentifier} Entry with params -> ${JSON.stringify(payload)}`);
  if (!_verifyPaymentsIsEnabled()) {
    sails.log.warn(`${logIdentifier} Payments Service feature disabled`);
    return Promise.resolve(true);
  }
  try {
    const completeTransactionResponse = await put({
      url: `${COMPLETE_TRANSACTION}`,
      data: payload,
      headers: { language: getLanguage().toLowerCase(), Authorization: await createServiceToken() },
    });
    sails.log.info(
      `${logIdentifier} Create transaction call response -> ${JSON.stringify(
        completeTransactionResponse,
      )}`,
    );
    return completeTransactionResponse.data;
  } catch (error) {
    sails.log.error(
      `${logIdentifier} An error occured while creating transaction -> ${JSON.stringify(error)}`,
    );
    throw PAYMENTS_SERVICE_ERROR();
  }
};

/**
 * Function takes order information and returns success if cancellation is completed on Payments Service
 * @param { Number } orderId
 * @param { String } orderPaymentMethod
 */
const cancelPaymentsTransaction = async payload => {
  const logIdentifier = `API version: V1, Context: PAYMENTS_SERVICE, cancelPaymentsTransaction()`;
  sails.log(`${logIdentifier} Entry with params -> ${JSON.stringify(payload)}`);
  if (!_verifyPaymentsIsEnabled()) {
    sails.log.warn(`${logIdentifier} Payments Service feature disabled`);
    return Promise.resolve(true);
  }
  try {
    const cancelTransactionResponse = await put({
      url: `${CANCEL_TRANSACTION}`,
      data: payload,
      headers: { language: getLanguage().toLowerCase(), Authorization: await createServiceToken() },
    });
    sails.log.info(
      `${logIdentifier} Cancel transaction call response -> ${JSON.stringify(
        cancelTransactionResponse,
      )}`,
    );
    return cancelTransactionResponse.data;
  } catch (error) {
    if (error.response.status === 404) {
      sails.log(`${logIdentifier} No transaction on Payments Service, resuming cancellation flow`);
      return { message: "No transaction on Payments Service, resuming cancellation flow" };
    }
    sails.log.error(
      `${logIdentifier} An error occured while cancelling transaction -> ${JSON.stringify(error)}`,
    );
    throw PAYMENTS_SERVICE_ERROR();
  }
};

/**
 * Function takes order information and returns success if rollback is completed on Payments Service
 * @param { Number } orderId
 * @param { String } orderPaymentMethod
 */
const rollbackPaymentsTransaction = async payload => {
  const logIdentifier = `API version: V1, Context: PAYMENTS_SERVICE, rollbackPaymentsTransaction()`;
  sails.log(`${logIdentifier} Entry with params -> ${JSON.stringify(payload)}`);
  if (!_verifyPaymentsIsEnabled()) {
    sails.log.warn(`${logIdentifier} Payments Service feature disabled`);
    return Promise.resolve(true);
  }
  try {
    const cancelTransactionResponse = await put({
      url: `${ROLLBACK_TRANSACTION}`,
      data: payload,
      headers: { language: getLanguage().toLowerCase(), Authorization: await createServiceToken() },
    });
    sails.log.info(
      `${logIdentifier} Rollback transaction call response -> ${JSON.stringify(
        cancelTransactionResponse,
      )}`,
    );
    return cancelTransactionResponse.data;
  } catch (error) {
    if (error.response.status === 404) {
      sails.log(`${logIdentifier} No transaction on Payments Service, resuming update order status flow`);
      return { message: "No transaction on Payments Service, resuming update order status flow" };
    }
    sails.log.error(
      `${logIdentifier} An error occured while rolling back transaction -> ${JSON.stringify(error)}`,
    );
    throw PAYMENTS_SERVICE_ERROR();
  }
};

/**
 * Function takes order information and update cash to be
 * @param { Number } orderId
 * @param { Object } total contains amount and currency
 * @returns {Number} cash to be collected
 */

const getPaymentsCashAmount = async cart => {
  const { orderId, amountPayable, currency } = cart;
  const logIdentifier = `API version: V1, Context: PAYMENTS_SERVICE, getPaymentsCashAmount()`;
  sails.log(`${logIdentifier} Entry with params -> ${JSON.stringify(cart)}`);
  if (!_verifyPaymentsIsEnabled()) {
    sails.log.warn(`${logIdentifier} Payments Service feature disabled`);
    return Promise.resolve(amountPayable);
  }
  try {
    const cashResponse = await put({
      url: `${GET_CASH}`,
      data: { orderId, total: { amount: amountPayable, currency }},
      headers: { language: getLanguage().toLowerCase(), Authorization: await createServiceToken() },
    });
    sails.log.info(
      `${logIdentifier} Get Cash call response -> ${JSON.stringify(
        cashResponse,
      )}`,
    );
    return {
      walletAmount: cashResponse?.data?.walletAmount?.amount || 0,
      cashAmount: cashResponse?.data?.cashAmount?.amount ?? amountPayable,
    };
  } catch (error) {
    sails.log.error(
      `${logIdentifier} An error occured while getting cash -> ${JSON.stringify(error)}`,
    );
    throw PAYMENTS_SERVICE_ERROR();
  }
};

const getSadadBreakdown = async data => {
  const { orderId, amountPayable, currency } = data;
  const logIdentifier = `API version: V1, Context: PAYMENTS_SERVICE, getSadadBreakdown()`;
  sails.log(`${logIdentifier} Entry with params -> ${JSON.stringify(data)}`);
  if (!_verifyPaymentsIsEnabled()) {
    sails.log.warn(`${logIdentifier} Payments Service feature disabled`);
    return Promise.resolve(amountPayable);
  }
  try {
    const breakdownResponse = await post({
      url: `${GET_SADAD_BREAKDOWN}`,
      data: { orderId, total: { amount: amountPayable, currency: currency }},
      headers: { language: getLanguage().toLowerCase(), Authorization: await createServiceToken() },
    });
    sails.log.info(
      `${logIdentifier} Get Cash call response -> ${JSON.stringify(
        breakdownResponse,
      )}`,
    );
    return {
      walletAmount: breakdownResponse?.data?.breakdown?.WALLET?.total?.amount || 0,
      sadadAmount: breakdownResponse?.data?.breakdown?.SADAD?.total?.amount || 0,
      cashAmount: breakdownResponse?.data?.breakdown?.CASH?.total?.amount || 0,
    };
  } catch (error) {
    sails.log.error(
      `${logIdentifier} An error occured while getting cash -> ${JSON.stringify(error)}`,
    );
    throw error;
  }
};

/**
 * Function takes orders in a batch and update cash to be collected in COD_WALLET payment_types
 * @param { Order[] } orders
 * @returns { Order[] } orders array with updated amountPayables
 */

const updateBatchPaymentsCashAmounts = async (orders, currency) => {
  const logIdentifier = `API version: V1, Context: PAYMENTS_SERVICE, updateBatchPaymentsCashAmounts()`;
  sails.log(`${logIdentifier} Entry with params -> ${JSON.stringify(orders)}`);
  if (!_verifyPaymentsIsEnabled()) {
    sails.log.warn(`${logIdentifier} Payments Service feature disabled`);
    return Promise.resolve(orders);
  }
  try {
    const walletOrders = orders.filter(order => order.payment_type === COD_WALLET );
    const batch = walletOrders.map(order => ({orderId: order.id, total: {amount: order.amountPayable, currency}}));
    const getCashResponse = await put({
      url: `${GET_CASH_BATCH}`,
      data: { batch },
      headers: { language: getLanguage().toLowerCase(), Authorization: await createServiceToken() },
    });
    sails.log.info(
      `${logIdentifier} Get Batch Cash call response -> ${JSON.stringify(
        getCashResponse,
      )}`,
    );
    const cashAmounts = getCashResponse.data || [];
    const updateOrders = orders.map(order => ({
      ...order,
      amountPayable: cashAmounts[order.id] ? cashAmounts[order.id]?.cashAmount?.amount : order.amountPayable,
      walletAmount: cashAmounts[order.id] ? cashAmounts[order.id]?.walletAmount?.amount : 0,
    }));
    return updateOrders;
  } catch (error) {
    sails.log.error(
      `${logIdentifier} An error occured while getting batch cash -> ${JSON.stringify(error)}`,
    );
    throw error;
  }
};

const getOrdersBreakdown = async orders => {
  const logIdentifier = `API version: V1, Context: PAYMENTS_SERVICE, getOrdersBreakdown()`;
  sails.log(`${logIdentifier} Entry with params -> ${JSON.stringify(orders)}`);
  if (!_verifyPaymentsIsEnabled()) {
    sails.log.warn(`${logIdentifier} Payments Service feature disabled`);
    return Promise.resolve(orders);
  }

  const eligibleOrders = orders.filter(order =>
    order.paymentType === COD_WALLET ||
    order.paymentType === SADAD ||
    order.paymentType === SADAD_WALLET,
  );
  const batch = eligibleOrders.map(order =>
    ({orderId: order.id, total: {amount: order.amountPayable, currency: order.currency}}));
  const orderBreakdownResponse = await post({
    url: `${GET_ORDERS_BREAKDOWN}`,
    data: { batch },
    headers: { language: getLanguage().toLowerCase(), Authorization: await createServiceToken() },
  });
  sails.log.info(
    `${logIdentifier} Get breakdown of all orders -> ${JSON.stringify(
      orderBreakdownResponse,
    )}`,
  );
  const orderBreakdown = orderBreakdownResponse.data || [];
  const ordersBreakdownMap = {};
  orders.map(order => {
    ordersBreakdownMap[order.id] = {
      amountPayable: orderBreakdown[order.id] ? orderBreakdown[order.id]?.cashAmount : order.amountPayable,
      walletAmount: orderBreakdown[order.id] ? orderBreakdown[order.id]?.walletAmount : 0,
      sadadAmount: orderBreakdown[order.id] ? orderBreakdown[order.id]?.sadadAmount : 0,
    };
  });
  return ordersBreakdownMap;
};

const _verifyPaymentsIsEnabled = () => (globalConf.IS_PAYMENTS_ENABLED === "true");

module.exports = {
  createPaymentsTransaction,
  completePaymentsTransaction,
  cancelPaymentsTransaction,
  rollbackPaymentsTransaction,
  getPaymentsCashAmount,
  updateBatchPaymentsCashAmounts,
  getSadadBreakdown,
  getOrdersBreakdown,
};

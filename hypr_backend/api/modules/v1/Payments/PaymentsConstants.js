const orderPaymentEngineBaseUrl = process.env.ORDER_PAYMENT_ENGINE_BASE_URL || "https://dev.retailo.me/paymentorder";

module.exports = {
  URLS: {
    CREATE_TRANSACTION: `${orderPaymentEngineBaseUrl}/api/v1/transaction`,
    COMPLETE_TRANSACTION: `${orderPaymentEngineBaseUrl}/api/v1/transaction/complete`,
    CANCEL_TRANSACTION: `${orderPaymentEngineBaseUrl}/api/v1/transaction/cancel`,
    ROLLBACK_TRANSACTION: `${orderPaymentEngineBaseUrl}/api/v1/transaction/rollback`,
    GET_CASH: `${orderPaymentEngineBaseUrl}/api/v1/transaction/cashToBeCollected`,
    GET_SADAD_BREAKDOWN: `${orderPaymentEngineBaseUrl}/api/v1/transaction/subtransactions`,
    GET_CASH_BATCH: `${orderPaymentEngineBaseUrl}/api/v1/transaction/batchCashToBeCollected`,
    GET_ORDERS_BREAKDOWN: `${orderPaymentEngineBaseUrl}/api/v1/transaction/ordersBreakdown`,
  },
};

/* eslint-disable max-len */
const OdooRestClient = require("../clients/OdooRestClient");
const ProductDaoService = require("./ProductDaoService");
const SessionsService = require("./SessionService");
const AWSService = require("../services/AWSService");
const AWS = AWSService.getAWSConfig();
const sqs = new AWS.SQS();

const userExtractionService = require("../user_service_extraction/userService");

const {
  globalConf: {
    ODOO_CREATE_SALE_ORDER_FEATURE,
    ODOO_CREATE_RETURN_ORDER_FEATURE,
    ODOO_ADD_PRODUCT_FEATURE,
    ODOO_INVENTORY_SYNC_SQS_HOST,
    AWS_ACCOUNT_ID,
    ODOO_RETRY_SQS_NAME
  }
} = sails.config;

const { ODOO_SQS_RETRY_EVENT_TYPES: { ADD_PRODUCT, UPDATE_PRODUCT, SALE_CREATE, DELIVERY_RETURN } } = require("../services/Constants")

const queueUrl = `${ODOO_INVENTORY_SYNC_SQS_HOST}${AWS_ACCOUNT_ID}/${ODOO_RETRY_SQS_NAME}`;
const CONTEXT_NAME = "ODOO";
const SESSION_EXPIRED = "Odoo Session Expired";
const ODOO_SERVER_ERROR = "Odoo Server Error";
const ALLOWED_RETRIES = 3; // max 3 retries allowed

/**
 * Responsible to prepare odoo sale order request payload
 * @param batch under delivery
 * @returns {Promise<void>}
 */
const syncBatchData = async (batch) => {

  if (ODOO_CREATE_SALE_ORDER_FEATURE) {
    try {
      let agent = await userExtractionService.getOne({ id: batch.assigned_to, select: ["id", "name"] });
      let odooProducts = [];
      for (let product of batch.products) {
        odooProducts.push({
          productId: product.id,
          quantity: product.onboarded_quantity
        });
      }
      /** added location_id for exact pick for warehouse */
      let odooResponse = await createSaleOrder(batch.id, agent, odooProducts, batch.location_id);
      sails.log.info(`OdooService.syncBatchData completed to create sale order on Odoo. BatchId${batch.id}. Response is: ${odooResponse}`);
    } catch (e) {
      sails.log.error(`OdooService.syncBatchData failed to create sale order on Odoo. BatchId${batch.id}`);
    }
  } else {
    sails.log.info("OdooService.syncBatchData is invoked and ODOO_CREATE_SALE_ORDER_FEATURE toggle is off");
  }
};

/**
 * Responsible to prepare odoo sale order return request
 * @param batch under delivery return
 * @returns {Promise<void>}
 */
const syncBatchReturnData = async (batch) => {
  if (ODOO_CREATE_RETURN_ORDER_FEATURE) {
    try {
      let odooProducts = [];
      for (let product of batch.products) {
        /**
         * Change Request v1: 02-Aug-21
         * Change Log: sending back return quantity on odoo
        */
        /**
         * removed check for return quantity as a batch can have all orders delivered and no returns ( in that case we still need to call odoo )
         * added check for on boarded quantity, because if a product is not on boarded while creating sale order, we shouldn't be sending it back while closing
         */
        if (product.onboarded_quantity > 0) {
          odooProducts.push({
            productId: product.id,
            product_qty: product.return_quantity
          });
        }
      }
      if (odooProducts.length > 0) {
        let odooResponse = await createDeliveryReturn(batch.id, odooProducts);
        sails.log.info(`OdooService.syncBatchReturnData completed return delivery request successfully. ${odooResponse}`);
      } else {
        sails.log.info(`OdooService.syncBatchReturnData does not any product to sync with ODOO`);
      }

    } catch (e) {
      sails.log.error(`OdooService.syncBatchReturnData failed to create return order on Odoo. BatchId${batch.id}`);
    }
  } else {
    sails.log.info("ODOO_CREATE_RETURN_ORDER_FEATURE is toggled off");
  }
};

/**
 * Responsible to prepare odoo add product request
 * @param product need to add
 * @returns {Promise<void>}
 */
const syncProductData = async (product, update = false) => {
  if (ODOO_ADD_PRODUCT_FEATURE) {
    try {
      sails.log.info(`OdooService.syncProductData is adding product to odoo`);
      let odooProductResponse = !update ? await addProduct(product) : await updateProduct(product);
      if (odooProductResponse && odooProductResponse.odooProductId) {
        sails.log.info(`OdooService.syncProductData added product successfully to odoo`);
      } else {
        sails.log.info(`OdooService.syncProductData failed to add product to odoo. Message: ${odooProductResponse.message}`);
      }
    } catch (error) {
      sails.log.info(`Found exception in OdooService.syncProductData while adding product to odoo. Details: ${error}`);
    }
  } else {
    sails.log.info("ODOO_ADD_PRODUCT_FEATURE is toggled off");
  }
};

/**
 * This is an async function. Responsible to return session_id for ODOO cascade requests.
 * First we'll check from DB and if it's not there we'll call ODOO's RestClient
 * @returns {Promise<{session_id: null, message: string}|{session_id: *}>}
 */
const getSessionId = async (fetchFreshToken) => {

  sails.log.info("OdooService.getSessionId is invoked");

  let savedSession = await SessionsService.getByContextName(CONTEXT_NAME);

  if (savedSession && !fetchFreshToken) {
    return { session_id: savedSession.token };
  }

  sails.log.info("OdooService.getSessionId did not find token in db");
  let newSessionId = await OdooRestClient.getSessionId();

  if (!newSessionId) {
    sails.log.info("OdooService.getSessionId failed to get new token");
    return { session_id: null, message: "Failed to get new token from odoo" };
  }

  if (savedSession) {
    sails.log.info("OdooService.getSessionId is updating new token in db");
    await SessionsService.updateTokenByContextName(CONTEXT_NAME, newSessionId.session_id);
  } else {
    sails.log.info("OdooService.getSessionId is saving new token in db");
    await SessionsService.create(CONTEXT_NAME, newSessionId.session_id);
  }

  return newSessionId;
};

/**
 * This is an async function. Responsible to add a new product in ODOO using ODOO's RestClient.
 * First, it get session_id and then call ODOO's RestClient to add product
 * @param product
 * @returns {Promise<{odooProductId}|unknown>}
 */
const addProduct = async (product, retries = 0) => {
  sails.log.info("OdooService.addProduct is invoked");
  let fetchFreshToken = false;
  let retryCount = 0;
  let response = {};
  // introduced this because retries are only working for token expiry and not for any other promise rejection
  let errorFromOdoo = false;
  do {
    const odooSession = await getSessionId(fetchFreshToken);

    sails.log.info("OdooService.addProduct session_id received. Now adding product.");
    /**
     * @param session_id for authentication
     * @param product product json
     */
    try {
      response = await OdooRestClient.addProduct(odooSession.session_id, product);
      // we should make it false in order to stop retries upon successful response
      errorFromOdoo = false;
    } catch (err) {
      sails.log.error(`error while trying ${retryCount + 1} time`)
      errorFromOdoo = true;
    }
    retryCount++;
    if (response.message === SESSION_EXPIRED) {
      // we should only fetch fresh token if odoo responsded with session expired
      fetchFreshToken = true;
      sails.log.info("OdooService.addProduct session_id is expired. Now getting fresh session_id.");
    } else if (response.response && response.response.error.message === ODOO_SERVER_ERROR && retries !== ALLOWED_RETRIES) {
      sails.log.info(`OdooService.addProduct RETRY QUEUE ADDITION: ${ODOO_RETRY_SQS_NAME} - queueUrl: ${queueUrl}`);
      const params = {
        MessageBody: JSON.stringify({
          data: { product: product, retries: retries + 1 },
          eventType: ADD_PRODUCT
        }),
        QueueUrl: queueUrl
      };
      sails.log.info(`OdooService.addProduct: pushing event to sqs with body - ${JSON.stringify(params)}`);
      sqs.sendMessage(params, (err, data) => {
        if (err) {
          sails.log.error(`OdooService.addProduct Failed to add message to SQS queue. Error: ${JSON.stringify(err)}`);
        } else {
          sails.log.info(`OdooService.addProduct successfully added message to SQS queue. messageID: ${data.MessageId} message: ${JSON.stringify(data)}`);
        }
      })
    }
  } while (retryCount < 2 && (response.message === SESSION_EXPIRED || errorFromOdoo));

  if (response.odooProductId) {
    sails.log.info(`OdooService.addProduct added product successfully ${JSON.stringify(response)}`);
    return response;
  }

  sails.log.info(`OdooService.addProduct failed to add product. ${JSON.stringify(response)}`);
  return response;
};

/**
 * This is an async function. Responsible to create a Sale Order using ODOO's RestClient.
 * First, it get session_id and then call ODOO's RestClient to create a sale order.
 * @param batchId
 * @param agent
 * @param products
 * @returns {Promise<unknown>}
 */
const createSaleOrder = async (batchId, agent, products, locationId, retries = 0) => {
  sails.log.info("OdooService.createSaleOrder is invoked");
  let fetchFreshToken = false;
  let retryCount = 0;
  let response = {};
  // introduced this because retries are only working for token expiry and not for any other promise rejection
  let errorFromOdoo = false;
  do {

    const odooSession = await getSessionId(fetchFreshToken);
    sails.log.info("OdooService.createSaleOrder session_id received. Now creating order.");
    try {
      response = await OdooRestClient.createSaleOrder(odooSession.session_id, batchId, agent, products, locationId);
      // we should make it false in order to stop retries upon successful response
      errorFromOdoo = false;
    } catch (err) {
      sails.log.error(`error while trying ${retryCount + 1} time`)
      errorFromOdoo = true;
    }
    retryCount++;
    if (response.message === SESSION_EXPIRED) {
      // we should only fetch fresh token if odoo responsded with session expired
      fetchFreshToken = true;
      sails.log.info("OdooService.createSaleOrder session_id is expired. Now getting a fresh session_id");
    } else if (response.response && response.response.error.message === ODOO_SERVER_ERROR && retries !== ALLOWED_RETRIES) {
      sails.log.info(`OdooService.createSaleOrder RETRY QUEUE ADDITION: ${ODOO_RETRY_SQS_NAME} - queueUrl: ${queueUrl}`);
      const params = {
        MessageBody: JSON.stringify({
          data: {
            batchId: batchId,
            agent: agent,
            products: products,
            locationId: locationId,
            retries: retries + 1
          },
          eventType: SALE_CREATE
        }),
        QueueUrl: queueUrl
      };
      sails.log.info(`OdooService.createSaleOrder: pushing event to sqs with body - ${JSON.stringify(params)}`);
      sqs.sendMessage(params, (err, data) => {
        if (err) {
          sails.log.error(`OdooService.createSaleOrder Failed to add message to SQS queue. Error: ${JSON.stringify(err)}`);
        } else {
          sails.log.info(`OdooService.createSaleOrder successfully added message to SQS queue. messageID: ${data.MessageId} message: ${JSON.stringify(data)}`);
        }
      })
    }
  } while (retryCount < 2 && (response.message === SESSION_EXPIRED || errorFromOdoo));

  if (response.odooOrderId) {
    sails.log.info(`OdooService.createSaleOrder created sale order successfully ${JSON.stringify(response)}`);
    return response;
  }

  sails.log.info(`OdooService.createSaleOrder failed to create sale order. ${JSON.stringify(response)}`);
  return response;
};

/**
 * This is an async function. Responsible to create a delivery return order using ODOO's RestClient.
 * First, it get session_id and then call ODOO's RestClient to create a delivery return order.
 * @param batchId
 * @param products
 * @param retries
 * @returns {Promise<void>}
 */
const createDeliveryReturn = async (batchId, products, retries = 0) => {
  sails.log.info("OdooService.createDeliveryReturn is invoked");
  let fetchFreshToken = false;
  let retryCount = 0;
  let response = {};
  // introduced this because retries are only working for token expiry and not for any other promise rejection
  let errorFromOdoo = false;
  do {
    const odooSession = await getSessionId(fetchFreshToken);
    sails.log.info("OdooService.createDeliveryReturn session_id received. Now creating order.");
    try {
      response = await OdooRestClient.createDeliveryReturn(odooSession.session_id, batchId, products);
      // we should make it false in order to stop retries upon successful response
      errorFromOdoo = false;
    } catch (err) {
      sails.log.error(`error while trying ${retryCount + 1} time`)
      errorFromOdoo = true;
    }
    retryCount++;
    if (response.message === SESSION_EXPIRED) {
      // we should only fetch fresh token if odoo responded with session expired
      fetchFreshToken = true;
      sails.log.info("OdooService.createDeliveryReturn session_id is expired. Now getting fresh session_id");
    } else if (response.response && response.response.error.message === ODOO_SERVER_ERROR && retries !== ALLOWED_RETRIES) {
      sails.log.info(`OdooService.createDeliveryReturn RETRY QUEUE ADDITION: ${ODOO_RETRY_SQS_NAME} - queueUrl: ${queueUrl}`);
      const params = {
        MessageBody: JSON.stringify({
          data: {
            batchId: batchId,
            products: products,
            retries: retries + 1
          },
          eventType: DELIVERY_RETURN
        }),
        QueueUrl: queueUrl
      };
      sails.log.info(`OdooService.createSaleOrder: pushing event to sqs with body - ${JSON.stringify(params)}`);
      sqs.sendMessage(params, (err, data) => {
        if (err) {
          sails.log.error(`OdooService.createDeliveryReturn Failed to add message to SQS queue. Error: ${JSON.stringify(err)}`);
        } else {
          sails.log.info(`OdooService.createDeliveryReturn successfully added message to SQS queue. messageID: ${data.MessageId} message: ${JSON.stringify(data)}`);
        }
      })
    }
  } while (retryCount < 2 && (response.message === SESSION_EXPIRED || errorFromOdoo)); // retry in all other cases based on odoo error except odoo server error with 200 response

  if (response.deliveryReturnId) {
    sails.log.info(`OdooService.createDeliveryReturn created delivery return successfully ${JSON.stringify(response)}`);
    return response;
  }

  sails.log.info(`OdooService.createDeliveryReturn failed to create delivery return. ${JSON.stringify(response)}`);
  return response;
};

/**
 * Responsible to sync the product's quantity with Odoo.
 * It fetches product from DB and update the quantity in DB by productId.
 * @returns {Promise<{success: boolean}>}
 */
const syncProductsQuantity = async (payload, addQuantity = true) => {

  for (let odooProduct of payload.products) {

    let product = await ProductDaoService.findById(odooProduct.productId);
    if (!product) {
      sails.log.info(`OdooService.syncProductsQuantity did not find a product by id(${odooProduct.productId})`);
      continue;
    }
    const quantityToBeUpdated = addQuantity ? product.stock_quantity + odooProduct.quantity : product.stock_quantity - odooProduct.quantity
    await ProductDaoService.updateStockQuantityById(odooProduct.productId, quantityToBeUpdated);
    // sending original product stock and updated quantity to maintain history of odoo updates
    await ProductDaoService.createHistory(odooProduct, product.stock_quantity, quantityToBeUpdated, payload.eventType)
    await ProductService.updateProductInEs(odooProduct.productId);
  }

  return { success: true };
};

/**
 * This is an async function. Responsible to update a product in ODOO using ODOO's RestClient.
 * First, it get session_id and then call ODOO's RestClient to update product
 * @param product
 * @returns {Promise<{odooProductId}|unknown>}
 */
const updateProduct = async (product, retries = 0) => {
  sails.log.info("OdooService.updateProduct is invoked");
  let fetchFreshToken = false;
  let retryCount = 0;
  let response = {};
  // introduced this because retries are only working for token expiry and not for any other promise rejection
  let errorFromOdoo = false;
  do {
    const odooSession = await getSessionId(fetchFreshToken);

    sails.log.info("OdooService.updateProduct session_id received. Now updating product.");
    /**
     * @param session_id for authentication
     * @param product product json
     */
    try {
      response = await OdooRestClient.updateProduct(odooSession.session_id, product);
      // we should make it false in order to stop retries upon successful response
      errorFromOdoo = false;
    } catch (err) {
      /**
       * purpose of implementing this was that retries aren't working before
       */
      sails.log.error(`error while trying ${retryCount + 1} time`)
      errorFromOdoo = true;
    }
    retryCount++;
    if (response.message === SESSION_EXPIRED) {
      // we should only fetch fresh token if odoo responded with session expired
      fetchFreshToken = true;
      sails.log.info("OdooService.updateProduct session_id is expired. Now getting fresh session_id.");
    } else if (response.response && response.response.error.message === ODOO_SERVER_ERROR && retries !== ALLOWED_RETRIES) {
      sails.log.info(`OdooService.updateProduct RETRY QUEUE ADDITION: ${ODOO_RETRY_SQS_NAME} - queueUrl: ${queueUrl}`);
      const params = {
        MessageBody: JSON.stringify({
          data: { product: product, retries: retries + 1 },
          eventType: UPDATE_PRODUCT
        }),
        QueueUrl: queueUrl
      };
      sails.log.info(`OdooService.updateProduct: pushing event to sqs with body - ${JSON.stringify(params)}`);
      sqs.sendMessage(params, (err, data) => {
        if (err) {
          sails.log.error(`OdooService.updateProduct Failed to add message to SQS queue. Error: ${JSON.stringify(err)}`);
        } else {
          sails.log.info(`OdooService.updateProduct successfully added message to SQS queue. messageID: ${data.MessageId} message: ${JSON.stringify(data)}`);
        }
      })
    }
  } while (retryCount < 2 && (response.message === SESSION_EXPIRED || errorFromOdoo));

  if (response.odooProductId) {
    sails.log.info(`OdooService.updateProduct updated product successfully ${JSON.stringify(response)}`);
    return response;
  }

  sails.log.info(`OdooService.updateProduct failed to update product. ${JSON.stringify(response)}`);
  return response;
};

module.exports = {
  syncBatchData,
  syncBatchReturnData,
  syncProductData,
  syncProductsQuantity,
  getSessionId,
  createDeliveryReturn,
  createSaleOrder,
  addProduct,
  updateProduct
};

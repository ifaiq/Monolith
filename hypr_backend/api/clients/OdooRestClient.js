const Axios = require('axios');

const OdooHistoryService = require('../services/OdooHistoryService');

const {
  globalConf: {
    ODOO_HOST,
    ODOO_PASSWORD,
    ODOO_USERNAME,
    ODOO_DB_NAME
  }
} = sails.config;

const {
  constants: {
    routes: { ODOO_INTEGRATION: { AUTH_API, ADD_PRODUCT_API, CREATE_SALE_ORDER_API, DELIVERY_RETURN_API, UPDATE_PRODUCT_API } },
    request: {
      RESOURSES: { POST, PUT },
      HEADER: {
        COOKIE, CONTENT, CONTENT_TYPE_JSON,
      }
    },
    productTypes: { PRODUCT }
  },
} = require('../constants/http');

module.exports = {

  /**
   * Responsible to get a new session_id from ODOO
   * @returns {Promise}
   */
  getSessionId: () => {

    sails.log.info('OdooRestClient.getSessionId is invoked');

    let url = `${ODOO_HOST}${AUTH_API}`;
    let payload = {
      jsonrpc: "2.0",
      params: {
        login: ODOO_USERNAME,
        password: ODOO_PASSWORD,
        db: ODOO_DB_NAME
      }
    };

    return new Promise((resolve, reject) => {
      Axios.post(url, payload)

        .then((response) => {

          OdooHistoryService.create(url, POST, JSON.stringify(payload), JSON.stringify(response.data));

          sails.log.info(`OdooRestClient.getSessionId received new token ${JSON.stringify(response.data)}`);

          let sessionID = response.headers['set-cookie'][0].split(";")[0];

          resolve({ session_id: sessionID });
        })
        .catch((error) => {

          OdooHistoryService.create(url, POST, JSON.stringify(payload), error.toString(), true);

          sails.log.error(`OdooRestClient.getSessionId failed to get new token. Details: ${JSON.stringify(error)}`);

          reject(error)
        });
    });
  },

  /**
   * Responsible to add new product on ODOO
   * @param sessionId
   * @param product
   * @returns {Promise<unknown>}
   */
  addProduct: (sessionId, product) => {

    sails.log.info('OdooRestClient.addProduct is invoked');
    const { location_id: wareHouseDetails } = product;
    let url = `${ODOO_HOST}${ADD_PRODUCT_API}`;
    let payload = {
      params: {
        warehouse_details: [{
          warehouse_id: wareHouseDetails.id,
          name: wareHouseDetails.name,
          code: `${wareHouseDetails.name} ${wareHouseDetails.id}`, // concat name and id as we dont have code against warehouses for now
          is_delivery_set_to_done: true
        }], // sending warehouse details to odoo
        data: {
          retailo_product_id: product.id,
          default_code: product.sku,
          name: `${product.name} ${product.size} ${product.unit}`,
          lst_price: product.mrp,
          standard_price: product.cost_price,
          sale_ok: !product.disabled,
          purchase_ok: true,
          type: PRODUCT
        }
      }
    };
    const logIdentifier = `ODOO CALL: ${url} -`
    sails.log(`${logIdentifier} add product called with params -> ${JSON.stringify(payload)}`);
    return new Promise((resolve, reject) => {
      Axios.request({
        url: url,
        method: POST,
        headers: getHeader(sessionId),
        data: payload
      })
        .then((response) => {

          OdooHistoryService.create(url, POST, JSON.stringify(payload), JSON.stringify(response.data));

          sails.log.info(`OdooRestClient.addProduct received response ${JSON.stringify(response.data)}`);

          resolve({
            productId: product.id,
            odooProductId: response.data.result,
            message: response.data.error ? response.data.error.message ? response.data.error.message : response.data.message : 'Product added successfully',
            response: response.data // key to check odoo server error in case of 200
          });
        })
        .catch((error) => {

          OdooHistoryService.create(url, POST, JSON.stringify(payload), error.toString(), true);

          sails.log.error(`OdooRestClient.addProduct failed to add new product. Details: ${JSON.stringify(error)}`);

          reject(error)
        });
    });
  },


  /**
   * Responsible to create a new sale order on ODOO
   * @param sessionId
   * @param batchId
   * @param agent
   * @param products
   * @returns {Promise}
   */
  createSaleOrder: (sessionId, batchId, agent, products, locationId) => {

    sails.log.info('OdooRestClient.createSaleOrder is invoked');

    let url = `${ODOO_HOST}${CREATE_SALE_ORDER_API}`;
    let payload = {
      params: {
        customer_data: {
          retailo_retailer_id: agent.id,
          name: agent.name
        },
        agent_data: {
          retailo_retailer_id: agent.id,
          name: agent.name
        },
        warehouse_id: locationId,
        batch_id: batchId,
        products: products
      }
    };
    const logIdentifier = `ODOO CALL: ${url} -`
    sails.log(`${logIdentifier} create sale order called with params -> ${JSON.stringify(payload)}`);
    return new Promise((resolve, reject) => {
      Axios.request({
        url: url,
        method: POST,
        headers: getHeader(sessionId),
        data: payload
      })
        .then((response) => {

          OdooHistoryService.create(url, POST, JSON.stringify(payload), JSON.stringify(response.data));
          
          sails.log.info(`OdooRestClient.createSaleOrder received response ${JSON.stringify(response.data)}`);

          resolve({ odooOrderId: true, response: response.data });
        })
        .catch((error) => {

          OdooHistoryService.create(url, POST, JSON.stringify(payload), error.toString(), true);

          sails.log.error(`OdooRestClient.createSaleOrder failed to create sale order. Details: ${JSON.stringify(error)}`);

          reject(error)
        });
    });
  },

  /**
   * Responsible to create delivery return id on ODOO
   * @param sessionId
   * @param batchId
   * @param products
   * @returns {Promise}
   */
  createDeliveryReturn: (sessionId, batchId, products) => {

    sails.log.info('OdooRestClient.createDeliveryReturn is invoked');

    let url = `${ODOO_HOST}${DELIVERY_RETURN_API}${batchId}`;
    let payload = {
      params: {
        picking_type_id: 1,
        products: products
      }
    };
    const logIdentifier = `ODOO CALL: ${url} -`
    sails.log(`${logIdentifier} create delivery return called with params -> ${JSON.stringify(payload)}`);

    return new Promise((resolve, reject) => {
      Axios.request({
        url: url,
        method: POST,
        headers: getHeader(sessionId),
        data: payload
      })
        .then((response) => {

          OdooHistoryService.create(url, POST, JSON.stringify(payload), JSON.stringify(response.data));

          sails.log.info(`OdooRestClient.createDeliveryReturn received response ${JSON.stringify(response.data)}`);
          // sent back true to avoid service function compatibility failure
          resolve({ deliveryReturnId: true, message: "Operation completed successfully", response: response.data });
        })
        .catch((error) => {

          OdooHistoryService.create(url, POST, JSON.stringify(payload), error.toString(), true);

          sails.log.error(`OdooRestClient.createDeliveryReturn failed to create delivery return. Details: ${JSON.stringify(error)}`);

          reject(error)
        });
    });
  },

  /**
  * Responsible to update product on ODOO
  * @param sessionId
  * @param product
  * @returns {Promise<unknown>}
  */
  updateProduct: (sessionId, product) => {

    sails.log.info('OdooRestClient.updateProduct is invoked');
    let url = `${ODOO_HOST}${UPDATE_PRODUCT_API}/${product.id}`;
    let payload = {
      params: {
        data: {
          name: `${product.name} ${product.size} ${product.unit}`,
          sale_ok: !product.disabled,
          default_code: product.sku,
          type: PRODUCT
        }
      }
    };

    const logIdentifier = `ODOO CALL: ${url} -`
    sails.log(`${logIdentifier} update product called with params -> ${JSON.stringify(payload)}`);

    return new Promise((resolve, reject) => {
      Axios.request({
        url: url,
        method: PUT,
        headers: getHeader(sessionId),
        data: payload
      })
        .then((response) => {

          OdooHistoryService.create(url, POST, JSON.stringify(payload), JSON.stringify(response.data));

          sails.log.info('OdooRestClient.updateProduct received response');

          resolve({
            productId: product.id,
            odooProductId: response.data.result,
            message: response.data.error ? response.data.error.message ? response.data.error.message : response.data.message : 'Product updated successfully',
            response: response.data
          });
        })
        .catch((error) => {

          OdooHistoryService.create(url, POST, JSON.stringify(payload), error.toString(), true);

          sails.log.error(`OdooRestClient.updateProduct failed to update product. Details: ${JSON.stringify(error)}`);

          reject(error)
        });
    });
  },
};

getHeader = (sessionId) => {
  return { CONTENT: CONTENT_TYPE_JSON, COOKIE: sessionId };
};

const { Consumer } = require('sqs-consumer');
const OdooService = require("./OdooService");
const OdooHistoryService = require('../services/OdooHistoryService');
const AWSService = require("../services/AWSService");
const { ENVIRONMENTS: { DEVELOPMENT }, ODOO_EVENT_TYPES: { SCRAP, PURCHASE_RETURN }, ODOO_SQS_RETRY_EVENT_TYPES: { ADD_PRODUCT, UPDATE_PRODUCT, SALE_CREATE, DELIVERY_RETURN } } = require('../services/Constants')
const AWS = AWSService.getAWSConfig();
const sqs = new AWS.SQS();

const {
    globalConf: {
        ODOO_INVENTORY_SYNC_SQS_HOST,
        AWS_ACCOUNT_ID,
        ODOO_INVENTORY_SYNC_SQS_NAME,
        ODOO_PRODUCT_SYNC_FEATURE,
        ODOO_RETRY_SQS_NAME
    }
} = sails.config;
const queueUrl = `${ODOO_INVENTORY_SYNC_SQS_HOST}${AWS_ACCOUNT_ID}/${ODOO_INVENTORY_SYNC_SQS_NAME}`;
const retryQueueUrl = `${ODOO_INVENTORY_SYNC_SQS_HOST}${AWS_ACCOUNT_ID}/${ODOO_RETRY_SQS_NAME}`;

const { NODE_ENV } = process.env;

if (NODE_ENV !== DEVELOPMENT) {
    const app = Consumer.create({
        queueUrl: queueUrl,
        handleMessage: (message) => {
            OdooHistoryService.create('N/A', 'handleMessage', JSON.stringify(message), 'N/A');
            sails.log.info(`Received a message to sync product quantity from ODOO - ${message.Body}`);
            let payload = JSON.parse(message.Body);
            const addQuantity = payload.eventType === SCRAP || payload.eventType === PURCHASE_RETURN ? false : true;
            OdooService.syncProductsQuantity(payload, addQuantity);
        },
        sqs: sqs
    });

    const retryQueue = Consumer.create({
        queueUrl: retryQueueUrl,
        handleMessage: (message) => {
            sails.log.info(`Received a message to retry event from ODOO_RETRY_QUEUE - ${JSON.stringify(message.Body)}`);
            const { eventType, data } = JSON.parse(message.Body);
            sails.log.info(`EVENT TYPE: ${eventType} - data: ${JSON.stringify(data)}`);
            switch (eventType) {
                case 1:
                    sails.log.info(`RETRY: #${data.retries} -- OdooService.addProduct with params ${JSON.stringify(data)} - ${data.retries}`)
                    OdooService.addProduct(data.product, data.retries);
                    break;
                case 2:
                    sails.log.info(`RETRY: #${data.retries} -- OdooService.updateProduct with params ${JSON.stringify(data)} - ${data.retries}`)
                    OdooService.updateProduct(data.product, data.retries);
                    break;
                case 3:
                    sails.log.info(`RETRY: #${data.retries} -- OdooService.createSaleOrder with params ${JSON.stringify(data)} - ${data.retries}`)
                    OdooService.createSaleOrder(data.batchId, data.agent, data.products, data.locationId, data.retries);
                    break;
                case 4:
                    sails.log.info(`RETRY: #${data.retries} -- OdooService.createDeliveryReturn with params ${JSON.stringify(data)} - ${data.retries}`)
                    OdooService.createDeliveryReturn(data.batchId, data.products, data.retries);
                    break;
            }
        },
        sqs: sqs
    });


    app.on('error', (err) => {
        OdooHistoryService.create('N/A', 'error', err.message, 'N/A');
        sails.log.info("Error while reading a message to sync product quantity from ODOO");
    });

    app.on('processing_error', (err) => {
        OdooHistoryService.create('N/A', 'processing_error', err.message, 'N/A');
        sails.log.info("Processing error while reading a message to sync product quantity from ODOO");
    });

    app.on('timeout_error', (err) => {
        OdooHistoryService.create('N/A', 'timeout_error', err.message, 'N/A');
        sails.log.info("Timeout error while reading a message to sync product quantity from ODOO");
    });

    retryQueue.on('error', (err) => {
        OdooHistoryService.create('N/A', 'error', err.message, 'N/A');
        sails.log.info("Error while reading a message to retry event from ODOO_RETRY_QUEUE");
    });

    retryQueue.on('processing_error', (err) => {
        OdooHistoryService.create('N/A', 'processing_error', err.message, 'N/A');
        sails.log.info("Processing error while reading a message to retry event from ODOO_RETRY_QUEUE");
    });

    retryQueue.on('timeout_error', (err) => {
        OdooHistoryService.create('N/A', 'timeout_error', err.message, 'N/A');
        sails.log.info("Timeout error while reading a message to retry event from ODOO_RETRY_QUEUE");
    });

    if (ODOO_PRODUCT_SYNC_FEATURE) {
        app.start();
        retryQueue.start();
    } else {
        sails.log.info("ODOO_PRODUCT_SYNC_FEATURE flag is OFF");
    }
}

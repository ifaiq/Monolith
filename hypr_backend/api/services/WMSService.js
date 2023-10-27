/* eslint-disable max-len */
const ProductDaoService = require("./ProductDaoService");
const { updateProductInEs } = require("./ProductService");
const {
  productService: {
    clearAllAssociatedSortedsetsRedis,
    clearProductFromRedis,
  },
} = require("../modules/v1/Product");
const { clearProductCache } = require("../modules/v1/Redis/RedisService");
const { createIdempotency } = require("../modules/v1/Idempotency");
const { WMS_EVENT_TYPES } = require("../services/Constants");

const {
  redisService: {
    locking,
    unLocking,
  },
} = require("../modules/v1/Redis");
const { createMessage } = require("../../utils/sqs-producer")
const {
  globalConf: {
    MONOLITH_TO_STOCKFLO_PRODUCT_INVENTORY_SYNC_QUEUE_NAME,
    STOCKFLO_TO_MONOLITH_PRODUCT_INVENTORY_SYNC_QUEUE_NAME,
    AWS_ACCOUNT_ID,
    AWS_SQS_HOST
  }
} = sails.config;
const { Consumer } = require('sqs-consumer');
const { findByIdempotencyKey } = require("../modules/v1/Idempotency");
const AWSService = require("../services/AWSService");
const AWS = AWSService.getAWSConfig();
const sqs = new AWS.SQS();

const monolith_to_stockflo_queue_url = `${AWS_SQS_HOST}${AWS_ACCOUNT_ID}/${MONOLITH_TO_STOCKFLO_PRODUCT_INVENTORY_SYNC_QUEUE_NAME}`;
const stockflo_to_monolith_queue_url = `${AWS_SQS_HOST}${AWS_ACCOUNT_ID}/${STOCKFLO_TO_MONOLITH_PRODUCT_INVENTORY_SYNC_QUEUE_NAME}`;

const app = Consumer.create({
  queueUrl: stockflo_to_monolith_queue_url,
  handleMessage: async (message) => {
      sails.log.info(`Received a message to sync product quantity from Stockflo - ${message.Body}`);
      let payload = JSON.parse(message.Body);
      const { idempotency_key } = payload;
      let result = await findByIdempotencyKey(idempotency_key);
      if (result) {
          return { success: true };
      }
      result = await syncProductsQuantityWMS(payload);
      return { success: true };
  },
  sqs: sqs
});

app.on('error', (err) => {
  sails.log.info("Error while reading a message to sync product quantity from Stockflo");
});

app.on('processing_error', (err) => {
  sails.log.info("Processing error while reading a message to sync product quantity from Stockflo");
});

app.on('timeout_error', (err) => {
  sails.log.info("Timeout error while reading a message to sync product quantity from Stockflo");
});

if (process.env.ALLOW_INVENTORY_UPDATE_SQS == 'true') {
  app.start();
}

/**
 * Sends message to product inventory sync queue
 * @param payload
 */
const syncProductInventoryOnStockflo = async (payload) => {
  const logIdentifier = `Context: WMSService.syncProductInventoryOnStockflo`;
  sails.log.info(`${logIdentifier} called with product: ${JSON.stringify(payload)}`);
  const params = {
    MessageBody: JSON.stringify(payload),
    QueueUrl: monolith_to_stockflo_queue_url
  };
  createMessage(params, logIdentifier);
 }

/**
 * Lock products
 * @param products Array of product_ids
 * @returns {Promise<Array of locks>}
 */
 const lockProducts = async productIds => {
  const ttl = 10000
  const locks = []
  try {
    await Promise.all(productIds.map(async id => {
      const resource = `locks:products:${id}`;
      locks.push(await locking(resource, ttl));
    }))
    return locks
  } catch (error) {
    sails.log.error(`ERROR: Locking products for update syncProductsQuantityWMS: ${error}`)
    sails.log.info(`syncProductsQuantityWMS: Releasing locks for all products: ${productIds}`)
    locks.forEach(lock => unLocking(lock))
    throw (error)
  }
}

/**
 * Responsible to sync the product's quantity with Odoo.
 * It fetches product from DB and update the quantity in DB by productId.
 * @returns {Promise<{success: boolean}>}
 */
const syncProductsQuantityWMS = async (payload) => {
  const { type, reason, idempotency_key, products, physicalQuantity, stockQuantity } = payload;
  const logIdentifier = `Context: WMSService.syncProductsQuantityWMS()`;
  sails.log.info(`${logIdentifier} type: ${type}, reason: ${reason}, idempotency_key: ${idempotency_key}, products: ${JSON.stringify(products)}`);
  // Get locks on all products
  const locks = await lockProducts(products.map(product => product.id))
  sails.log.info(`${logIdentifier} Locks acquired and starting products sync`);
  const response = await sails.getDatastore().transaction(async db => {
    try {
      await Promise.all(products.map(async prod => {
        const { id, quantity } = prod;
        const product = await Product.findOne({ id }).usingConnection(db);
        if (!product) {
          const errMsg = `${logIdentifier} did not find a product by id(${id})`;
          sails.log.info(errMsg);
          throw new Error(errMsg);
        }
        const oldJson = { ...prod, type, idempotency_key, physical_stock: product.physical_stock, stock_quantity: product.stock_quantity };
        sails.log.info(`${logIdentifier} productId: ${id}, old_physical_stock: ${product.physical_stock}, old_stock_quantity: ${product.stock_quantity}`);
        if (reason === WMS_EVENT_TYPES.INITIAL_COUNT && type === WMS_EVENT_TYPES.ADJUSTMENT) {
          const nativeQuery = `SELECT IFNULL(SUM(oi.original_quantity), 0) as reserved_quantity 
          FROM order_items oi LEFT JOIN orders o 
          ON o.id = oi.order_id 
          WHERE  oi.product_id = ${id} AND o.status_id IN ( 2, 4, 12 )`;
          const reservedQuantity = await sails.sendNativeQuery(nativeQuery).usingConnection(db);
          const phyicalQuantityToBeUpdated = product.physical_stock + quantity;
          const stock_quantity = phyicalQuantityToBeUpdated - (reservedQuantity?.rows[0]?.reserved_quantity || 0);
          await Product.updateOne({ id }).set({ stock_quantity, physical_stock: phyicalQuantityToBeUpdated }).usingConnection(db);
          sails.log.info(`${logIdentifier} productId: ${id}, new_physical_stock: ${phyicalQuantityToBeUpdated}, new_stock_quantity: ${stock_quantity}`);
        } else {
          if (process.env.IS_STOCKFLO_LOCATION_ENABLED == "true"){
            let query;
            if (!physicalQuantity && !stockQuantity) {
              const errMsg = `${logIdentifier} Both Physical and Stock Quantity cannot be false`;
              throw new Error(errMsg);
            }

            if (physicalQuantity && stockQuantity) {
              query = `UPDATE products SET stock_quantity = stock_quantity + $1, physical_stock = physical_stock + $1 WHERE id = ${id};`;
            }
            else if (physicalQuantity) {
              query = `UPDATE products SET physical_stock = physical_stock + $1 WHERE id = ${id};`;
            }
            else {
              query = `UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = ${id};`;
            }
            await sails.sendNativeQuery(query, [quantity]).usingConnection(db);
            sails.log.info(`${logIdentifier} productId: ${id}, new_physical_stock: ${product.physical_stock+(physicalQuantity && quantity)}, new_stock_quantity: ${product.stock_quantity+(stockQuantity && quantity)}`);
          }
          else{
            const query = `UPDATE products SET stock_quantity = stock_quantity + $1, physical_stock = physical_stock + $1 WHERE id = ${id};`;
            await sails.sendNativeQuery(query, [quantity]).usingConnection(db);
            sails.log.info(`${logIdentifier} productId: ${id}, new_physical_stock: ${product.physical_stock+quantity}, new_stock_quantity: ${product.stock_quantity+quantity}`);
          }
        }
        // sending original product stock and updated quantity to maintain history of WMS updates
        await ProductDaoService.createHistoryWMS({ ...prod, type, idempotency_key }, db, oldJson);
      }));

      sails.log.info(`${logIdentifier} Quantities synced with WMS`);
      const response = {
        statusCode: 200,
        success: true,
        idempotencyKey: idempotency_key,
        message: `Inventory Updated Successfully`,
      };
      await createIdempotency({
        statusCode: 200,
        idempotencyKey: idempotency_key,
        response: JSON.stringify(response),
      }, db);
      sails.log.info(`${logIdentifier} Idempotency record created with key: ${idempotency_key} with statusCode: 200`);
      return response;
    } catch (error) {
      sails.log.error(`ERR: ${logIdentifier} error: ${JSON.stringify(error)}`);
      const response = {
        message: error.message,
        success: false,
        idempotencyKey: idempotency_key,
        statusCode: 400,
      };
      await createIdempotency({
        statusCode: 400,
        idempotencyKey: idempotency_key,
        response: JSON.stringify(response),
      });
      sails.log.info(`${logIdentifier} Idempotency record created with key: ${idempotency_key} with statusCode: 400`);
      error.response = response;
      throw (response);
    } finally {
      sails.log.info(`${logIdentifier} Releasing locks for products`);
      locks.forEach(lock => unLocking(lock))
    }
  });

  sails.log.info(`${logIdentifier} Updating Redis and ES`);
  // Product update successful. Update relevant caches
  for (const prod of products) {
    try {
      clearAllAssociatedSortedsetsRedis(prod.id);
      clearProductFromRedis(prod.id);
      clearProductCache({ ...prod, productId: prod.id });
      updateProductInEs(prod.id);
    } catch (error) {
      sails.log.error(`${logIdentifier} ERR: Product update successful -> Update relevant caches error: ${JSON.stringify(error)}`);
    }
  }
  sails.log.info(`${logIdentifier} Redis and ES updated successfully`);
  return response;
};

/**
 * Validates if the available for sale quantity in warehouse is greater than the reserved quantity
 */
 const validateProductQuantityWMS = async (products, warehouseId) => {
  const logIdentifier = `Context: WMSService.validateProductQuantityWMS()`;
  sails.log.info(`${logIdentifier} products: ${JSON.stringify(products)}`);
    try {
      const productData = [];
      const batchesInProgress = await DeliveryBatch.find({
        select: ["id", "products"], where: {location_id: warehouseId, status_id: 1, deleted_at: null}
      });
      const productsData = {};
      products.forEach((item) => {
        const product = item;
        productsData[product['id']] = product;
      });
      const productBatchesData = await fetchProductBatchesData(batchesInProgress, productsData);
      await Promise.all(products.map(async prod => {
        const { id, availableQuantity } = prod;
        const product = await Product.findOne({ id });
        if (!product) {
          const errMsg = `${logIdentifier} did not find a product by id(${id})`;
          sails.log.info(errMsg);
          throw new Error(errMsg);
        }
        const isReservedQuantityGreaterThanAvailableQuantity = productBatchesData[id]?.onBoardedQuantity > availableQuantity;
        if (isReservedQuantityGreaterThanAvailableQuantity) {
          productData.push({
            productId: id,
            batches: productBatchesData[id]?.batches
          });
        }
      }));
      return productData;
    } catch (error) {
      sails.log.error(`ERR: ${logIdentifier} error: ${JSON.stringify(error)}`);
      throw (error);
    }
};

/**
 * Sum onboarded_quantity of product in all batches
 */
const fetchProductBatchesData = async (batches, products) => {
  const productBatchesData = {};
  batches.forEach((batch) => {
    JSON.parse(batch.products).forEach((product) => {
      if (products[product.id]) {
        if (!productBatchesData[product.id]) {
          productBatchesData[product.id] = {
            batches: [batch.id],
            onBoardedQuantity: product['onboarded_quantity'] || 0
          };
        } else {
          productBatchesData[product.id].batches = [...productBatchesData[product.id].batches, batch.id];
          productBatchesData[product.id].onBoardedQuantity = productBatchesData[product.id].onBoardedQuantity + product['onboarded_quantity'];
        }
      }
    });
  });
  return productBatchesData;
};


module.exports = { syncProductsQuantityWMS, syncProductInventoryOnStockflo, validateProductQuantityWMS };

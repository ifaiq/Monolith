const batchDao = require("./BatchDao");
const nonCashDao = require("../Batch/NonCashClosingDao");
// const DenominationDao = require("../Batch/CashDenominationDao");
const CashDao = require("../Batch/CashCollectedDao");
const batchOrderDao = require("./BatchOrderDao");
const orderDao = require("../Order/OrderDao");
const batchHistoryDao = require("./BatchHistoryDao");
const batchPerformanceDao = require("./BatchPerformanceDao");
const {
  batchInventoryHelper: { calculateBatchInventory, calculateClosedBatchInventory },
  deliveryAgentHelper: { calculateBatchPerformace },
} = require("./Helpers");
const {
  BATCH_STATES: { CLOSED, COMPLETED }, BATCH_HISTORY_TYPES, RTG_STATES: { DONE, LOCKED, IN_PROGRESS },
} = require("./Constants");
const { validateBatchStatus } = require("./BatchValidator");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const { fetchOrderItemsOfBatches, fetchOrdersOfBatches } = require("./BatchPerformance");
const { orderMapper } = require("../Order/OrderMapper");
const { errors: { BATCH_STATUS_CLOSED } } = require("./Errors");
const { findProductByIds } = require("../Product/ProductService");
const { convertIntoKeyValuePair } = require("../Batch/Utils");
const snakecaseKeys = require("snakecase-keys");
const customerExtractionService = require("../../../user_service_extraction/customerService");
const locationExtractionService = require("../../../config_service_extraction/locationsExtraction");
const camelcaseKeys = require("camelcase-keys");
const { PAYMENT_TYPES: { COD_WALLET, SADAD, SADAD_WALLET }} = require("../../../modules/v1/Order/Constants");
const skipperbetters3 = require("skipper-better-s3");

/**
 * This function takes the id and return batch.
 *
 * @param {Number} id
 * @returns {Object} batch
 */
const findBatchByCheckedId = async id => await batchDao.findByCheckedId(id);

/**
 * This function takes the id and return batch.
 *
 * @param {Number} id
 * @returns {Object} batch
 */
const findBatchByCriteria = async criteria => await batchDao.findByCriteria(criteria);

const findManyBatchesByCriteria = async criteria => await batchDao.findManyByCriteria(criteria);

/**
 * This function takes the skip, limit and return batches.
 *
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Batches[]} batches
 */
const findBatches = async (skip, limit) => await batchDao.findAll(skip, limit);

/**
 * This function takes the skip, limit and return batches.
 *
 * @param {Object} criteria
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Batches[]} batches
 */
const findBatchOrders = async (criteria, skip, limit) => await batchOrderDao.findAll(criteria, skip, limit);

/**
 * This function takes the batch and return new batch.
 *
 * @param {Object} batch
 * @returns {Object} batch
 */
const createBatch = async batch => await batchDao.create(batch);

/**
 * This function takes the criteria and return batches count.
 *
 * @param {Object} criteria
 * @returns {Number} total batches
 */
const countBatches = async criteria => await batchDao.count(criteria);

/**
 * This function takes the id, batch and return updated batch.
 *
 * @param {Number} id
 * @param {Object} batch
 * @param {DB} connection
 * @returns {Object} batch
 * snake case conversion is being removed at service level as it is being done on dao level
 */
const updateBatch = async (id, batch, connection = null) => await batchDao.update(id, batch, connection);
// const findBatch = async id => await CashDao.findBatchId(id);
/**
 * This function takes the nonCashDetails and saves it in DB.
 *
 * @param {Object}
 * @returns {Object}
 */
const saveNonCash = async batch => await nonCashDao.createEach(batch);

const saveCash = async batch => await CashDao.create(batch);

const findnonCashId = async id => await nonCashDao.findnonCashId(id);

const findCashId = async id => await CashDao.findCashId(id);

const updateNonCash = async (id, attachment, connection = null) => await nonCashDao.update(id, attachment, connection);

/**
 *
 * @param {Number} id
 * @param {orderItems[]} orderItems
 * @param {Boolean} stockIn
 * @param {Number} statusId
 * @param connection
 */
const updateBatchInventory = async (id, orderItems, stockIn, statusId) => {
  const logIdentifier = `API version: ${v1},
  Context: BatchService.updateBatchInventory(),`;
  sails.log(`${logIdentifier} called with the params - id: ${id}, orderItems: ${JSON.stringify(orderItems)},
  stockIn: ${stockIn},
  statusId: ${statusId}}`);

  let { products } = await findBatchByCheckedId(id);
  products = JSON.parse(products);
  const batchInventory = calculateBatchInventory(products, orderItems, stockIn);
  sails.log(`${logIdentifier} batch inventory: ${JSON.stringify(batchInventory)}`);
  products = JSON.stringify(batchInventory);
  const updatebatch = {
    products,
    statusId,
  };
  return await updateBatch(id, updatebatch);
};

/**
 * This function takes the id, batch and returns updated batch
 *
 * @param {Number} id
 * @param {Object} batch
 * @returns {Object} batch
 */
const updateClosedBatchInventory = async (id, batch) => {
  const logIdentifier = `API version: ${v1},
  Context: BatchService.updateClosedBatchInventory(),`;
  sails.log(`${logIdentifier} called with the params ->
  id: ${id},
  batch: ${batch}`);

  // find batch to have return keys updated
  const foundBatch = await findBatchByCheckedId(id);
  validateBatchStatus(foundBatch.statusId, CLOSED);
  // call calculateBatchInventory function
  batch.products = await calculateClosedBatchInventory(id, foundBatch.products, batch.products);
  // update batch and return
  batch.statusId = CLOSED;
  const updatedBatch = await updateBatch(id, batch);
  updatedBatch.products = JSON.parse(updatedBatch.products);
  createBatchHistory({
    batchId: batch.id,
    type: BATCH_HISTORY_TYPES.CLOSED,
    oldJSON: foundBatch,
    newJSON: updatedBatch,
  });
  OdooService.syncBatchReturnData(updatedBatch);
  return updatedBatch;
};

/**
 * This function takes the skip, limit and return batches.
 *
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Batches[]} batches
 */
const findBatchesByIds = async ids => await batchDao.findByIds(ids);

/**
 * This function takes the order id , returns the latest batch of the order.
 *
 * @param {Number} orderId
 * @returns {Batches[]} batche
 */
const findLatestBatchStatusByOrderId = async orderId => {
  const batchOrder = await batchOrderDao.findLatestByOrderId(orderId);
  if (!batchOrder) return null; // If order not in any batch, return null.
  const { statusId } = await batchDao.findByCheckedId(batchOrder.batchId);
  return statusId;
};

/**
 * The function calculates batch performance
 * @param {Number} batchId
 * @returns {Object}
 */
const getBatchPerformanceMatrix = async batchId => {
  const batchPerformance = await batchPerformanceDao.findByCriteria({batchId});
  if (!_.isEmpty(batchPerformance)) {
    const { deliveredGmv, totalGmv, deliveredOrders, totalOrders } = batchPerformance;
    return {
      ...batchPerformance,
      deliveredTouchPointsCount: batchPerformance.deliveredTouchpoints,
      totalTouchPointsCount: batchPerformance.totalTouchpoints,
      gmvReliability: Math.round(deliveredGmv / totalGmv * 100),
      orderReliability: Math.round(deliveredOrders / totalOrders * 100),
    };
  }
  const batchOrders = await batchOrderDao.findAll({ batchId, deletedAt: null });
  const orderItems = await fetchOrderItemsOfBatches(batchOrders);
  const ordersData = await fetchOrdersOfBatches(batchOrders);
  const itemsByOrderId = orderItems.map(item => ({ id: item[0]?.orderId, orderItems: [...item] }));
  const batchOrdersDetails = ordersData.map(order =>
    ({ ...order, items: itemsByOrderId.find(item => item?.id === order.id)?.orderItems,
    }),
  );
  return calculateBatchPerformace(batchOrdersDetails);
};

const saveBatchPerformance = async data => {
  try {
    const performance = await getBatchPerformanceMatrix(data.batchId);
    const batchPerformance = {
      ...data,
      ...performance,
      deliveredTouchpoints: performance.deliveredTouchPointsCount,
      totalTouchpoints: performance.totalTouchPointsCount,
    };
    await batchPerformanceDao.create(batchPerformance);
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.saveBatchPerformance(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
  }
};


const findOrdersByBatch = async (batchId, customerId, orderId) => {
  const logIdentifier = `API version: ${v1}, Context: BatchService.findOrdersByBatch(),`;
  // eslint-disable-next-line max-len
  sails.log(`${logIdentifier} called with the params -> batchId: ${batchId}, customerId: ${customerId}, orderId: ${orderId}`);

  let orders = [];
  if (orderId) {
    orders = orderMapper(await orderDao.findAll({id: orderId}));
  } else {
    const batchOrders = await findBatchOrders({ batchId: +batchId });
    const ordersCriteria = { id: { in: batchOrders.map(obj => obj.orderId) } };
    if (customerId) {
      ordersCriteria.customerId = +customerId;
    }
    orders = orderMapper(await orderDao.findAll(ordersCriteria));
  }
  return orders;
};

/**
 * This function takes the data and creates batch history.
 *
 * @param {Object} data
 * @returns {Object} batch
 */
const createBatchHistory = async (data, connection = null) => {
  sails.log.info(`BatchService.updateBatchQueue(): Creating History for Batch: ${data.batchId}`);
  await batchHistoryDao.create(data);
  sails.log.info(`BatchService.updateBatchQueue(): History created for Batch: ${data.batchId}`);
};

/**
 * This function takes the batch id and returns batch history.
 *
 * @param {Number} batchId
 * @returns {Object} batch
 */
const findBatchHistoryByBatchId = async (batchId, connection = null) => await batchHistoryDao.findByBatchId(batchId);

/**
 * This function takes the data and creates batch history.
 *
 * @param {number} orderId
 * @param {number} batchId
 */
const assignOrderToBatch = async (orderId, batchId) => {
  await batchOrderDao.createDeliveryBatchOrder(orderId, batchId);
  sails.log.info(`BatchService.assignOrderToBatch(): New spot order added to the batch`);
};
const getSpotProductsByBatch = async batchId => {
  const batch = await batchDao.findByCriteria({ where: { id: batchId }});
  if(+batch.statusId === +CLOSED) {
    throw  BATCH_STATUS_CLOSED();
  }
  const products = JSON.parse(batch.products);
  return products
    .filter(product => product.spot_current_quantity);
};

const getBatchStatusByBatch = async batchId => {
  const batch = await batchDao.findByCriteria({ where: { id: batchId }});
  return ({
    currentBatchStatusId: batch?.statusId,
    currentBatchLocationId: batch?.locationId,
  });
};

const getRtgCompletedBatches = async agentId => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.getRtgCompletedBatches(),`;
    sails.log(`${logIdentifier} called with the params -> agentId: ${agentId}`);

    const date = new Date();
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    let fromDate = date.getTime() + timezoneOffset - 172800000;  // 48 hours ago
    fromDate = GeneralHelper.dateObjectToMySqlDateConversion(new Date(fromDate));
    const deliveryBatches =
      await findManyBatchesByCriteria({
        rtg_agent_id: parseInt(agentId),
        status_id: COMPLETED,
        rtg_status_id: {in: [DONE, LOCKED]},
        updated_at: { ">": fromDate },
      });

    const response = deliveryBatches.map(batch => ({ batchId: batch.id, isRedFlag: batch.isRed }));
    sails.log(`${logIdentifier} called with response -> ${response}`);
    return response;
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.getRtgCompletedBatches(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const fetchBatchReturnedProducts = async batchId => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.getBatchReturnedProducts(),`;
    sails.log(`${logIdentifier} called with the params -> batchId: ${batchId}`);

    // Only fetch products that current and onBoarded quantity greater than 0
    const batchProducts =
      JSON.parse((await findBatchByCriteria({
        id: parseInt(batchId),
        status_id: COMPLETED,
      }))
        .products)
        .filter(product => product.current_quantity > 0 && product.onboarded_quantity > 0);

    const productIds = batchProducts
      .map(product => product.id);
    const products = await findProductByIds(productIds);
    const productData = convertIntoKeyValuePair(products, "id");
    const batchProductsData = batchProducts.map(product => ({
      ...product,
      imageUrl: productData[product.id]?.imageUrl,
      size: productData[product.id]?.size,
      unit: productData[product.id]?.unit,
    }));
    sails.log(`${logIdentifier} called with response -> ${batchProductsData}`);
    return batchProductsData;
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.getRtgCompletedBatches(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const getRtgCompletedSkus = async batchId => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.getRtgCompletedSkus(),`;
    sails.log(`${logIdentifier} called with the params -> BatchId: ${batchId}`);

    const deliveryBatch =
    await findBatchByCriteria({
      id: batchId,
      status_id: COMPLETED,
      rtg_status_id: {in: [DONE, LOCKED]},
    });
    // cloning deliveryBatch but removing products
    const newDeliveryBatch = (({ products, ...rest }) => rest)(deliveryBatch);
    const responseProducts = [];
    camelcaseKeys(JSON.parse(deliveryBatch.products)).forEach(product => {
      if (product?.receivedQuantity > 0 || product?.damages > 0 || product?.missingQuantity > 0) {
        responseProducts.push(product);
      }
    });
    const productIds = responseProducts.map(product => product.id);
    const newProducts = await findProductByIds(productIds);
    const productData = convertIntoKeyValuePair(newProducts, "id");
    const batchProductsData = responseProducts.map(product => ({
      ...product,
      imageUrl: productData[product.id]?.imageUrl,
      size: productData[product.id]?.size,
      unit: productData[product.id]?.unit,
    }));
    sails.log(`${logIdentifier} called with response -> ${batchProductsData}`);
    return { batch: newDeliveryBatch, products: batchProductsData };
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.getRtgCompletedSkus(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const getInventoryShortageBatch = async batchId => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.getInventoryShortageBatch(),`;
    sails.log(`${logIdentifier} called with the params -> BatchId: ${batchId}`);

    const deliveryBatch = await findBatchByCheckedId(batchId);
    const responseProducts = [];
    camelcaseKeys(JSON.parse(deliveryBatch.products)).forEach(product => {
      if (product?.damages > 0 || product?.missingQuantity > 0) {
        responseProducts.push(product);
      }
    });
    let totalInventoryLoss = 0;
    const shortage = responseProducts.map(product => {
      const productLoss = product.price * (product.missingQuantity + product.damages);
      totalInventoryLoss = totalInventoryLoss + productLoss;
      return {
        productShortage: productLoss,
        productId: product.id,
      };
    });
    sails.log(`${logIdentifier} called with response -> ${shortage}`);
    return {
      productLoss: shortage,
      totalInventoryLoss,
    };
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.getInventoryShortageBatch(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const fetchBatchRemainingProducts = async batchId => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.fetchBatchRemainingProducts(),`;
    sails.log(`${logIdentifier} called with the params -> batchId: ${batchId}`);

    // Only fetch products that current is zero and onBoarded quantity greater than 0
    const batchProducts =
      JSON.parse((await findBatchByCriteria({
        id: parseInt(batchId),
        status_id: COMPLETED,
      }))
        .products)
        .filter(product => product.current_quantity === 0 && product.onboarded_quantity > 0);

    const productIds = batchProducts
      .map(product => product.id);
    const products = await findProductByIds(productIds);
    const productData = convertIntoKeyValuePair(products, "id");
    const batchProductsData = batchProducts.map(product => ({
      ...product,
      imageUrl: productData[product.id]?.imageUrl,
      size: productData[product.id]?.size,
      unit: productData[product.id]?.unit,
    }));
    sails.log(`${logIdentifier} called with response -> ${batchProductsData}`);
    return batchProductsData;
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.fetchBatchRemainingProducts(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const batchRtgStatusUpdate = async (batchId, body) => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.batchRtgStatusUpdate(),`;
    sails.log(`${logIdentifier} called with the params -> batchId: ${batchId}`);

    const { products, agentId, startTime } = body;

    const batchProducts =
      camelcaseKeys(JSON.parse((await findBatchByCriteria({
        id: parseInt(batchId),
        status_id: COMPLETED,
      })).products));

    const productData = convertIntoKeyValuePair(products, "id");

    let isRed = false;
    let isRtgInProgress = false;

    let totalMissing = 0; let totalDamages = 0; let totalInventoryLoss = 0.0;

    const updatedProducts = batchProducts.map(product => {
      if (productData[product.id]) {
        const receivedQuantity = productData[product.id]?.receivedQuantity;
        const damages = productData[product.id]?.damages;
        const missingQuantity = productData[product.id]?.missingQuantity;
        const inventory_loss = product.price * (damages + missingQuantity);
        totalMissing += missingQuantity;
        totalDamages += damages;
        totalInventoryLoss += inventory_loss;
        if (receivedQuantity + damages !== product.currentQuantity) {
          isRed = true;
          if (receivedQuantity + damages > product.currentQuantity) {
            isRtgInProgress = true;
          }
        }
        return {
          ...snakecaseKeys(product),
          ...snakecaseKeys(productData[product.id]),
          inventory_loss: inventory_loss,
        };
      }
      return {
        ...snakecaseKeys(product),
      };
    });

    const requestPayload = {
      products: JSON.stringify(updatedProducts),
      rtgAgentId: agentId,
      rtgStatusId: isRtgInProgress ? IN_PROGRESS : DONE,
      isRed,
      missing: totalMissing,
      damages: totalDamages,
      inventoryLoss: totalInventoryLoss,
      rtgStartTime: startTime,
      rtgEndTime: new Date(),
    };

    sails.log(`${logIdentifier} called with request -> ${requestPayload}`);

    await updateBatch(batchId, requestPayload);

    sails.log(`${logIdentifier} called with response -> ${isRed}`);

    return { isRed, message: "RTG status updated successfully" };
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.batchRtgStatusUpdate(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const batchRtgAssignUpdate = async (batchId, body) => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.batchRtgAssignUpdate(),`;
    sails.log(`${logIdentifier} called with the params -> batchId: ${batchId}`);

    const { agentId  } = body;

    const requestPayload = {
      rtgAgentId: agentId,
    };

    sails.log(`${logIdentifier} called with request -> ${requestPayload}`);

    await updateBatch(batchId, requestPayload);

    return { requestPayload, message: "rtgAgentId updated successfully" };
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.batchRtgAssignUpdate(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const batchRtgUnassignUpdate = async batchId => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.batchRtgUnassignUpdate(),`;
    sails.log(`${logIdentifier} called with the params -> batchId: ${batchId}`);

    const requestPayload = {
      rtgAgentId: null,
    };

    sails.log(`${logIdentifier} called with request -> ${requestPayload}`);

    await updateBatch(batchId, requestPayload);

    return { requestPayload, message: "rtgAgentId updated successfully" };
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.batchRtgUnassignUpdate(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};


const saveCashClosingBatch = async (details, batch_id) => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.saveCashClosingBatch(),`;
    sails.log(`${logIdentifier} called with the params -> batchId: ${batch_id}`);
    const updatedBatch = { difference_reason: details?.differenceReason, status_id: CLOSED, rtg_status_id: LOCKED };
    const saveCashvalue = {
      batch_id,
      amount: details?.amount,

    };
    const savenonCashvalue = snakecaseKeys(details).non_cash.map(info => ({ batch_id, ...snakecaseKeys(info) }));

    const updatedDB = {
      saveNonCash: await saveNonCash(savenonCashvalue),
      saveCash: await saveCash(saveCashvalue),
      updateBatch: await updateBatch(batch_id, updatedBatch),
    };

    sails.log(`${logIdentifier} called with request -> ${updatedDB}`);


    return { message: "Created successfully", updatedDB };
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.saveCashClosingBatch(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const getCashClosingData = async batchId => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.getCashClosingData(),`;
    sails.log(`${logIdentifier} called with the params -> BatchId: ${batchId}`);

    const nonCashBatch = await findnonCashId(batchId);
    const cashBatch = await findCashId(batchId);
    const deliveryBatch = await findBatchByCheckedId(batchId);
    const locationWithBuisnessUnit = camelcaseKeys(await locationExtractionService.find({
      id: deliveryBatch.locationId,
      relations: ["businessUnit"],
    }), { deep: true });
    const currencyCode = { currency: locationWithBuisnessUnit[0].businessUnit.currency,
      country: locationWithBuisnessUnit[0].businessUnit.countryCode };
    const collectionSummary = {
      grossCash: deliveryBatch.cashReceivable,
      cashCollected: deliveryBatch.cashCollected,
      difference_reason: deliveryBatch.differenceReason,
      nonCashCollectedArray: nonCashBatch ? nonCashBatch : [],
      cashCollectedArray: cashBatch,
      currencyCode,
    };
    sails.log(`${logIdentifier} called with response -> ${collectionSummary}`);
    return {collectionSummary};
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.getCashClosingData(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const attachSaveBatch = async req => {
  try {
    const file = req.file("file");
    const attachmentArray = [];
    if (file && file._files[0]) {
      let file_name = file._files[0].stream.filename;
      const fileNameParts = file_name.split(".");
      if (fileNameParts.length) {
        const newName = `${fileNameParts[0]} - ${Date.now()}.${fileNameParts[fileNameParts.length - 1]}`;
        file_name = newName.replace(/\s/g, "");
      }
      const options = {
        adapter: skipperbetters3,
        key: sails.config.globalConf.AWS_KEY,
        secret: sails.config.globalConf.AWS_SECRET,
        bucket: sails.config.globalConf.AWS_BUCKET,
        s3Params: { Key: file_name },
        region: sails.config.globalConf.AWS_REGION,
        saveAs: file_name,
      };
      const data = file.upload(options, (err, uploadedFiles) => {
        if (err) return err;
        return uploadedFiles;
      });

      const logIdentifier = `API version: ${v1}, Context: BatchService.attachSaveBatch()`;
      sails.log(`${logIdentifier} called with response -> ${data}`);
      const attachment = {key: file_name,
        location: `https://${sails.config.globalConf.AWS_BUCKET}.s3.me-south-1.amazonaws.com/${file_name}`};
      attachmentArray.push(attachment);
      return attachmentArray;
    }
    file.upload({ noop: true });
    file.noMoreFiles(); // clears all default errorTimeouts on the file streams in case file is malformed.
    return { message: "please attach file to upload!" };
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.attachSaveBatch(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const searchProductInBatchOrders = async (batchId, productName) => {
  try {
    const logIdentifier = `API version: ${v1}, Context: BatchService.searchProductInBatchOrders(),`;
    sails.log(`${logIdentifier} called with the params -> batchId: ${batchId}, productName: ${productName}`);
    const batch =
      await findBatchByCriteria({
        id: parseInt(batchId),
      });

    const productList = JSON.parse(batch.products)
      .filter(product => product.name.includes(productName.trim()));

    if (productList.length < 1) {
      return { message: "product name not found in batch", orders: [], products: [] };
    }

    // Fetch order data for the batch that have the searched product
    const query = `select orders.id, orders.customer_id, orders.placed_at, orders.status_id,
                   orders.payment_type, orders.location_id, orders.total_price,
                   orders.coupon_discount, orders.cash_received from orders
                   where id IN (select order_items.order_id
                    from (order_items
                    inner join delivery_batch_orders ON order_items.order_id = delivery_batch_orders.order_id)
                    where delivery_batch_orders.batch_id IN (${batchId})
                    AND order_items.product_id IN (${productList.map(product => product.id)}))`;

    let ordersData = camelcaseKeys((await sails.sendNativeQuery(query))?.rows, { deep: true });
    const allCustomerIds = _.uniq(ordersData.map(item => item.customerId));

    const allCustomers = allCustomerIds.length ? await customerExtractionService.findAll({
      relations: "shopDetails",
      allData: true,
    }, { id: allCustomerIds.join(",") }) : [];
    const allCustomersData = convertIntoKeyValuePair(allCustomers, "id");

    const locationWithBuisnessUnit = camelcaseKeys(await locationExtractionService.find({
      id: batch.locationId,
      relations: ["businessUnit"],
    }), { deep: true });

    const getFormattedData = await BatchService.getFormattedDataForOrders(ordersData, locationWithBuisnessUnit);
    const getAllOrderBreakdown = await BatchService.getOrdersBreakdown(getFormattedData);

    ordersData = await Promise.all(ordersData.map(async order => {
      let waiverAmount = 0;
      let sadadAmount = 0;
      let walletAmount = 0;
      if (order.statusId === Constants.HyprOrderStates.IN_TRANSIT ||
        order.statusId === Constants.HyprOrderStates.DELIVERED ||
        order.statusId === Constants.HyprOrderStates.PARTIAL_DELIVERED) {
        const orderWaiver = await OrderAmountAdjustment.findOne({
          order_id: order.id,
          context_name: "WAIVER",
          deleted_at: null,
        });
        if (orderWaiver) {
          const waiver = await Waiver.findOne({
            id: orderWaiver.context_id,
          });
          waiverAmount = parseFloat(waiver.amount.toFixed(2));
        }
      }
      const isZero = order.statusId === Constants.HyprOrderStates.CANCELLED ||
							order.statusId === Constants.HyprOrderStates.ON_HOLD;
      if (order.paymentType === COD_WALLET) {
        walletAmount = isZero ? 0 : getAllOrderBreakdown[order.id]?.walletAmount;
      } else if (order.paymentType === SADAD || order.paymentType === SADAD_WALLET) {
        walletAmount = isZero ? 0 : getAllOrderBreakdown[order.id]?.walletAmount;
        sadadAmount = isZero ? 0 : getAllOrderBreakdown[order.id]?.sadadAmount;
      }
      return {
        orderId: order?.id,
        orderStatus: Constants.HyprOrderStates.getOrderStatusFromId(order.statusId),
        paymentType: order?.paymentType,
        date: order?.placedAt,
        customerName: allCustomersData[order.customerId]?.name,
        shopName: allCustomersData[order.customerId]?.shop_details[0]?.shop_name,
        shopAddress: allCustomersData[order.customerId]?.address,
        opsWaiver: waiverAmount,
        walletAmount: walletAmount,
        sadadAmount: sadadAmount,
        cashReceived: order?.cashReceived,
        couponDiscount: order?.couponDiscount,
      };
    }));

    const response = {
      orders: ordersData,
      products: productList,
    };
    return response;
  } catch (error) {
    const logIdentifier = `API version: ${v1}, Context: BatchService.searchProductInBatchOrders(),`;
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

module.exports = {
  findBatchByCheckedId,
  findBatches,
  countBatches,
  createBatch,
  updateBatch,
  findBatchByCriteria,
  findBatchOrders,
  updateBatchInventory,
  updateClosedBatchInventory,
  findBatchesByIds,
  findLatestBatchStatusByOrderId,
  getBatchPerformanceMatrix,
  saveBatchPerformance,
  findOrdersByBatch,
  createBatchHistory,
  findBatchHistoryByBatchId,
  assignOrderToBatch,
  getSpotProductsByBatch,
  getBatchStatusByBatch,
  getRtgCompletedBatches,
  findManyBatchesByCriteria,
  fetchBatchReturnedProducts,
  getRtgCompletedSkus,
  fetchBatchRemainingProducts,
  batchRtgStatusUpdate,
  saveCashClosingBatch,
  getCashClosingData,
  saveCash,
  findnonCashId,
  getInventoryShortageBatch,
  searchProductInBatchOrders,
  attachSaveBatch,
  updateNonCash,
  batchRtgAssignUpdate,
  batchRtgUnassignUpdate,
};

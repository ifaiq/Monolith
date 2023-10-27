const camelcaseKeys = require("camelcase-keys");
const {
  batchService: {
    updateClosedBatchInventory,
    getBatchPerformanceMatrix,
    saveBatchPerformance,
    findBatchByCriteria,
    findOrdersByBatch,
    getSpotProductsByBatch,
    getBatchStatusByBatch,
    getRtgCompletedBatches,
    fetchBatchReturnedProducts,
    getRtgCompletedSkus,
    getInventoryShortageBatch,
    fetchBatchRemainingProducts,
    batchRtgStatusUpdate,
    getCashClosingData,
    saveCashClosingBatch,
    searchProductInBatchOrders,
    attachSaveBatch,
    batchRtgAssignUpdate,
    batchRtgUnassignUpdate,
  },
} = require("../../modules/v1/Batch");
const BatchService = require("../../services/BatchService");
const { BATCH_STATES: { CLOSED } } = require("../../modules/v1/Batch/Constants");
const { createInvoicesForBatchOrders } = require("../../modules/v1/EInvoice/EInvoiceService");
const { ORDER_STATES } = require("../../modules/v1/Order/Constants");

const update = async (req, res) => {
  const { user: { role }, userId } = req;
  const logIdentifier = `API version: V1, context: BatchController.update(), UserId: ${userId}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const { id } = req.params;
    const params = req.allParams();
    const batch = await updateClosedBatchInventory(id, params);
    if (batch?.statusId === CLOSED) {
      saveBatchPerformance({ agentId: batch.assignedTo, batchId: id });
      createInvoicesForBatchOrders(id);
    }

    res.ok();
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const getBatchPerformance = async (req, res) => {
  const { user: { role }, userId } = req;
  const logIdentifier = `API version: V1, context: BatchController.getBatchPerformanceMatrix(), 
    UserId: ${userId}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const { batchId } = req.allParams();
    const batch = await getBatchPerformanceMatrix(batchId);
    res.ok(batch);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const getActiveBatch = async (req, res) => {
  const { user: { role }, userId } = req;
  const logIdentifier = `API version: V1, context: BatchController.getActiveBatch(), UserId: ${userId}, Role: ${role},`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);

  try {
    const criteria = {
      assignedTo: userId,
      deletedAt: null,
      statusId: 1,
    };
    const batch = await findBatchByCriteria(criteria);
    res.ok(batch);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const getOrdersByBatchId = async (req, res) => {
  const { id, customerId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getOrdersByBatch(), BatchId: ${id}`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);

  try {
    const orders = await findOrdersByBatch(id, customerId);
    res.ok(orders);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const getOrdersOfCustomerByBatch = async (req, res) => {
  const { id, customerId, orderId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getOrdersOfCustomerByBatch(), BatchId: ${id}`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);

  try {
    const orders = await findOrdersByBatch(id, customerId, orderId);
    res.ok({ isOrdersDelivered: orders?.findIndex(order => order.statusId <= ORDER_STATES.IN_TRANSIT) === -1, orders });
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const getBatches = async (req, res) => {
  const { agentId, batchId, acceptBatch } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getBatches(), AgentId: ${agentId}`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    // Used lagecy BatchService code
    const batch = await BatchService.getBatchesForAgent({}, agentId, batchId, acceptBatch);
    res.ok(camelcaseKeys({
      batch,
    }, { deep: true }));
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};

const acceptBatch = async (req, res) => {
  const { batch } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.acceptBatch()`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    // Used lagecy BatchService code
    const acceptedBatch = await BatchService.updateAndAccept({}, batch);
    res.ok(camelcaseKeys({
      acceptedBatch,
    }, { deep: true }));
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const getSpotProductsByBatchId = async (req, res) => {
  const { batchId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getSpotProductsByBatch()`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    const spotProducts = await getSpotProductsByBatch(batchId);
    res.ok(spotProducts);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};

const getBatchStatusByBatchId = async (req, res) => {
  const { batchId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getBatchStatusByBatch()`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    const batchStatusId = await getBatchStatusByBatch(batchId);
    res.ok(batchStatusId);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};

const getRtgCompleted = async (req, res) => {
  const { agentId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getRtgCompleted(), AgentId: ${agentId}`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    const batches = await getRtgCompletedBatches(agentId);
    res.ok(camelcaseKeys({
      batches,
    }, { deep: true }));
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};

const getBatchReturnedProducts = async (req, res) => {
  const { batchId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getBatchReturnedProducts(), batchId: ${batchId}`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    const products = await fetchBatchReturnedProducts(batchId);
    res.ok(camelcaseKeys({
      products,
    }, { deep: true }));
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};

const getRtgCompletedProducts = async (req, res) => {
  const { batchId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getRtgCompletedProducts(), BatchId: ${batchId}`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    const data = await getRtgCompletedSkus(batchId);
    res.ok(camelcaseKeys({
      data,
    }, { deep: true }));
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};
const getInventoryShortage = async (req, res) => {
  const { batchId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getInventoryShortage(), BatchId: ${batchId}`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    const inventoryShortage = await getInventoryShortageBatch(batchId);
    res.ok(camelcaseKeys(
      inventoryShortage, { deep: true }));
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};
const getBatchRemainingProducts = async (req, res) => {
  const { batchId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getBatchRemainingProducts(), batchId: ${batchId}`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    const products = await fetchBatchRemainingProducts(batchId);
    res.ok(camelcaseKeys({
      products,
    }, { deep: true }));
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};

const updateBatchRtgStatus = async (req, res) => {
  const { batchId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.updateBatchRtgStatus(), 
    batchId: ${batchId}`;
  sails.log(`${logIdentifier} called with data -> ${JSON.stringify(req.body)}`);
  try {
    const response = await batchRtgStatusUpdate(batchId, req.body);
    res.ok(response);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};

const batchRtgAssign = async (req, res) => {
  const { batchId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.batchRtgAssign(), 
    batchId: ${batchId}`;
  sails.log(`${logIdentifier} called with data -> ${JSON.stringify(req.body)}`);
  try {
    const response = await batchRtgAssignUpdate(batchId, req.body);
    res.ok(response);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};

const batchRtgUnassign = async (req, res) => {
  const { batchId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.batchRtgUnassign(), 
    batchId: ${batchId}`;
  sails.log(`${logIdentifier} called with data -> ${JSON.stringify(req.body)}`);
  try {
    const response = await batchRtgUnassignUpdate(batchId);
    res.ok(response);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};
const saveCashClosing = async (req, res) => {
  const { batchId } = req.allParams();
  const { body } = req;
  const logIdentifier = `API version: V1, context: BatchController.saveCashClosing(), 
    batchId: ${batchId}`;
  sails.log(`${logIdentifier} called with data -> ${JSON.stringify(req.body)}`);
  try {
    const response = await saveCashClosingBatch(body, batchId);
    res.ok(response);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};

const attachSave = async (req, res) => {
  const logIdentifier = `API version: V1, context: BatchController.saveCashClosing(), 
    batchId: ${req.file}`;
  sails.log(`${logIdentifier} called with data -> ${JSON.stringify(req.file)}`);
  try {
    const response = await attachSaveBatch(req);
    res.ok(response);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};

const getCashClosing = async (req, res) => {
  const { batchId } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.getCashClosing(), batchId: ${batchId}`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    const result = await getCashClosingData(batchId);
    res.ok(camelcaseKeys({
      result,
    }, { deep: true }));
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};
const searchProductsInBatch = async (req, res) => {
  const { batchId, productName } = req.allParams();
  const logIdentifier = `API version: V1, context: BatchController.searchProductsInBatch(), batchId: ${batchId}`;
  sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  try {
    const batchData = await searchProductInBatchOrders(batchId, productName);
    res.ok(camelcaseKeys(batchData, { deep: true }));
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.serverError(error);
  }
};


module.exports = {
  update,
  getBatches,
  acceptBatch,
  getActiveBatch,
  getBatchPerformance,
  getOrdersByBatchId,
  getOrdersOfCustomerByBatch,
  getSpotProductsByBatchId,
  getBatchStatusByBatchId,
  getRtgCompleted,
  getBatchReturnedProducts,
  getRtgCompletedProducts,
  getBatchRemainingProducts,
  updateBatchRtgStatus,
  saveCashClosing,
  getCashClosing,
  searchProductsInBatch,
  getInventoryShortage,
  attachSave,
  batchRtgAssign,
  batchRtgUnassign,
};

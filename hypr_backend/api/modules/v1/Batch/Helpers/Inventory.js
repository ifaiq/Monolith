const { productService: { updateProductInventory } } = require("../../Product");
const { findAll: findAllBatch } = require("../BatchOrderDao");
const { findAll: findAllOrder } = require("../../Order/OrderDao");
const { findAll: findAllItems } = require("../../Order/OrderItemsDao");
const { ORDER_STATES: { ON_HOLD } } = require("../../Order/Constants");
/**
 *
 * @param {*} batchItems
 * @param {*} orderItems
 * @param {*} stockIn
 * @returns
 */
const calculateBatchInventory = (batchItems, orderItems, stockIn = true) => batchItems.map(batchItem => {
  // For the portal call, we are using id and for logistics app we are using productId to map order items.
  orderItems.map(orderItem => {
    if (batchItem.id === orderItem.id || batchItem.id === orderItem.productId) {
      if (stockIn) {
        batchItem.current_quantity += orderItem.quantity;
      } else {
        // We need to update batch queue and use this function in the batch queue to update the stock of batch
        // else case is already handled inthe batch queue in old code.
        if (batchItem.current_quantity >= orderItem.quantity) {
          batchItem.current_quantity -= orderItem.quantity;
        }
      }
    }
  });
  return batchItem;
});

const calculateClosedBatchInventory = async (batchId, currentbatchItems, batchItems) => {
  const batchOrders = await findAllBatch({ batchId });
  const orderIds = batchOrders.map(batchOrder => batchOrder.orderId);
  const orders = await findAllOrder({ id: { in: orderIds } });
  const onHoldItemsPromises = [];
  const productInventory = [];
  let warehouseId;
  orders.forEach(order => {
    if (order.locationId && !warehouseId) warehouseId = order.locationId;
    if (order.statusId === ON_HOLD) {
      onHoldItemsPromises.push(findAllItems({ OrderId: order.id }));
    }
  });
  let ohHoldOrderItems = await Promise.all(onHoldItemsPromises);
  ohHoldOrderItems = [].concat.apply([], ohHoldOrderItems);
  let currentbatchItemsJson = JSON.parse(currentbatchItems);
  currentbatchItemsJson = currentbatchItemsJson.map(currentbatchItem => {
    const batchItem = batchItems.find(batchProductItem => currentbatchItem.id === batchProductItem.id);
    const onHoldQuantity = ohHoldOrderItems
      .filter(
        onHoldOrderItem => +currentbatchItem.id === onHoldOrderItem.productId,
      )
      .reduce((quantity, item) => quantity + item.packedQuantity, 0);
    // We are subtracting the on hold order item's quantity as that should not be added to the inventory.
    /**
         * Change Request v1: 02-Aug-21
         * Change Log: adding back pick short while closing batch
        */
    const logIdentifier = `BATCH CLOSING CALL: `;
    sails.log.info(
      `${logIdentifier} batchID - ${batchId}, 
      return quantity - ${batchItem.returnQuantity}, 
      pickShort - ${currentbatchItem.pick_short}, onHold - ${onHoldQuantity}`,
    );
    const returnQuantity =
      batchItem.returnQuantity +
        (currentbatchItem.pick_short || 0) -
        onHoldQuantity >
        0
        ? batchItem.returnQuantity +
        (currentbatchItem.pick_short || 0) -
        onHoldQuantity
        : 0;
    currentbatchItem.return_reason = batchItem.returnReason || null;
    currentbatchItem.return_quantity = batchItem.returnQuantity;
    productInventory.push({
      id: currentbatchItem.id,
      quantity: batchItem.returnQuantity,
    });
    if (process.env.ALLOW_INVENTORY_UPDATE_WMS === "true") {
      // eslint-disable-next-line max-len
      updateProductInventory(currentbatchItem.id, returnQuantity, stockIn = true, returnPhysicalQty = batchItem.returnQuantity).then(() => {
        const result = ProductService.updateProductInEs(currentbatchItem.id);
        result.then(response => {
          response.success
            ? sails.log.info("SUCCESSFULLY UPDATED PRODUCT IN ES")
            : sails.log.info(result.trace);
        }).catch(e => {
          sails.log(`Exception: `, e);
        });
      });
    } else {
      updateProductInventory(currentbatchItem.id, returnQuantity, stockIn = true);
    }

    return currentbatchItem;
  });
  if (process.env.ALLOW_INVENTORY_UPDATE_WMS_SQS === "true") {
    WMSService.syncProductInventoryOnStockflo({
      type: Constants.INVENTORY_SYNC_TYPES.BATCH_CLOSE,
      warehouseId,
      batchId,
      products: productInventory,
    });
  }
  return JSON.stringify(currentbatchItemsJson);
};

module.exports = {
  calculateBatchInventory,
  calculateClosedBatchInventory,
};

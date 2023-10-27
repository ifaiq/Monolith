// Didn't import OrderService because it was causing circular dependency
// Dao Imports
const orderDao = require("../Order/OrderDao");
const {
  ORDER_STATES: {
    DELIVERED,
    CANCELLED,
    RETURNED,
    REJECTED,
    PARTIAL_DELIVERED,
  },
} = require("../Order/Constants");
/**
 * This function takes the id and return order.
 *
 * @param {Number} id
 * @returns {Object} order
 */
const findOrder = async id => await orderDao.find(id);

/**
 * This function takes the criteria and return order count.
 *
 * @param {Object} criteria
 * @returns {Number} total orders
 */
const countOrders = async criteria => await orderDao.count(criteria);

/**
 * This function takes the orderid and returns total shipments and current order.
 *
 * @param {Number} orderId
 * @returns {Object} shipment and current order
 */
const getTotalShipments = async orderId => {
  const currentOrder = await findOrder(orderId);
  const shipmentId = currentOrder.shipmentId;
  let totalShipments = 0;
  if(shipmentId) {
    criteria = {
      shipment_id: shipmentId,
    };
    totalShipments = await countOrders(criteria);
  }
  return {totalShipments, currentOrder};
};
/**
 * This function takes the shipmentid and returns the combined orderItems for all the shipments except
 * for the shipment whose orderId is passed as the second parameter.
 *
 * @param {Object} shipmentId
 * @param {Object} orderId
 * @returns {Object} JITOrderItems
 */
const getShipmentsOrderItems = async (shipmentId, orderId, allShipments = true) => {
  if (allShipments) {
    criteria = {
      shipment_id: shipmentId,
    };
  } else {
    criteria = {
      shipment_id: shipmentId,
      status_id: { nin: [RETURNED, DELIVERED, CANCELLED, REJECTED, PARTIAL_DELIVERED] },
    };
  }
  const JIT_ShipmentPromises = orderDao.findAll(criteria);
  let JITOrders = await Promise.resolve(JIT_ShipmentPromises);
  JITOrders = JITOrders.filter(JITOrder => JITOrder.id !== orderId); // TODO: Do this in criteria instead
  const JITOrderPromises = [];
  JITOrders.forEach(order => {
    JITOrderPromises.push(orderDao.findByIdAndPopulateItems(order.id));
  });
  const aggregateOrder = await Promise.all(JITOrderPromises);
  let JITOrderItems = [];
  aggregateOrder.forEach(orders => {
    JITOrderItems = [...JITOrderItems, ..._.cloneDeep(orders.orderItems)];
  });
  return { JITOrderItems, aggregateOrder };
};

module.exports =
{
  getTotalShipments,
  getShipmentsOrderItems,
};

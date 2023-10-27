const uuid4 = require("uuid4");
const moment = require("moment");

const clearCache = async data => {
  sails.log.debug(`Clear cache data: ${JSON.stringify(data)}`);
  return Promise.all([
    RedisService.flushKeys(
      `${RedisService.FILTER_NAMES.getOrdersByCustomerReference}_*customer_id:${data.customer_id}_*`,
    ),
    RedisService.flushKeys(
      `${RedisService.FILTER_NAMES.getOrdersBySalesAgent}__sales_agent_id:${data.sales_agent_id}__`,
    ),
    RedisService.flushKeys(
      `${RedisService.FILTER_NAMES.getPackerOrders}__*location_id:${data.location_id}_*`,
    ),
    RedisService.flushKeys(
      `${RedisService.FILTER_NAMES.getPackerOrdersForStore}__location_id:${data.location_id}__`,
    ),
  ]);
};

/**
 * There are multiple attributes in order table which will be deprecated.
 * We'll remove them after discussion with Business and Engineering leads in future sprints.
 * I added some TODOs to track them
 */

module.exports = {
  tableName: "orders",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      required: false,
      autoIncrement: true,
    },
    customer_id: {
      type: "number",
      required: false,
      allowNull: true
      // model: "customer",
    },
    sales_agent_id: {
      type: "number",
      required: false,
      allowNull: true
      // model: "user",
    },
    total_price: {
      type: "number",
      columnType: "float",
      required: false,
      allowNull: true,
    },
    status_id: {
      required: false,
      model: "OrderStatus",
    },
    order_items: {
      collection: "OrderItems",
      via: "order_id",
    },
    placed_at: {
      type: "ref",
      columnName: "placed_at",
      columnType: "datetime",
    },
    location_id: {
      type: "number",
    },
    cash_received: {
      type: "number",
      columnType: "float",
      allowNull: true,
    },
    disabled: {
      type: "boolean",
      defaultsTo: false,
    },
    delivery_boy_id: {
      type: "number",
      allowNull: true
      // model: "User",
    },
    packer_id: {
      type: "number",
      allowNull: true
      // model: "User",
    },
    packing_time: {
      type: "ref",
      columnName: "packing_time",
      columnType: "datetime",
    },
    delivery_time: {
      type: "ref",
      columnName: "delivery_time",
      columnType: "datetime",
    },
    customer_address_id: {
      type: "number",
      // model: "CustomerAddress",
    },
    payment_type: {
      type: "string",
      allowNull: true,
    },
    payment_reference: {
      type: "string",
      allowNull: true,
    },
    uuid: {
      type: "string",
      allowNull: true,
    },
    delivered_time: {
      type: "ref",
      columnType: "datetime",
    },
    deleted_by: {
      type: "number",
      allowNull: true
      // model: "User",
    },
    tax: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    refund_id: {
      type: "string",
      allowNull: true,
    },
    credit_buy_fee: {
      type: "number",
      columnType: "float",
      required: false,
    },

    // TODO: tip_amount We can remove after it clarity from business and engineering leads in future
    tip_amount: {
      type: "number",
      allowNull: true,
    },

    // TODO: tip_type We can remove after it clarity from business and engineering leads in future
    tip_type: {
      type: "string",
      allowNull: true,
    },
    is_updated: {
      type: "boolean",
      defaultsTo: false,
    },
    // TODO: retailo_order_id We can remove after it clarity from business and engineering leads in future
    retailo_order_id: {
      type: "string",
      allowNull: true,
    },
    status_reason_id: {
      model: "OrderStatusReasons",
    },
    // TODO: channel We can remove after it clarity from business and engineering leads in future
    channel: {
      type: "string",
      allowNull: true,
    },
    // TODO: service_charge_type We can remove after it clarity from business and engineering leads in future
    service_charge_type: {
      type: "string",
      allowNull: true,
    },
    // TODO: service_charge_value We can remove after it clarity from business and engineering leads in future
    service_charge_value: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    // TODO: delivery_charge_type We can remove after it clarity from business and engineering leads in future
    delivery_charge_type: {
      type: "string",
      allowNull: true,
    },
    // TODO: delivery_charge_value We can remove after it clarity from business and engineering leads in future
    delivery_charge_value: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    coupon_id: {
      type: "number",
      allowNull: true,
      columnType: 'integer',
    },
    coupon_discount: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    volume_based_discount: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    // TODO: delivery_priority We can remove after it clarity from business and engineering leads in future
    delivery_priority: {
      type: "number",
      allowNull: true,
    },
    card_reference: {
      type: "string",
      allowNull: true,
    },
    // TODO: from_web We can remove after it clarity from business and engineering leads in future
    from_web: {
      type: "boolean",
      defaultsTo: false,
    },
    // TODO: call_centre_status We can remove after it clarity from business and engineering leads in future
    call_centre_status: {
      type: "string",
      defaultsTo: "PENDING",
    },
    shipment_id: {
      type: "string",
      columnType: "string",
      allowNull: true,
      required: false,
    },
    is_invoice_downloaded: {
      type: "boolean",
      allowNull: true,
    },
    device_id: {
      type: "string",
      allowNull: true,
    },
    app_version: {
      type: "string",
      allowNull: true,
    },
    feedback: {
      collection:'OrderFeedback',
      via: 'order_id'
    },
    location_delivery_charges: {
      type: "number",
      allowNull: true,
      columnType: "float"
    },
    location_free_delivery_limit:{
      type: "number",
      allowNull: true,
      columnType: "float"
    },
    coupon_products_total: {
      type: "number",
      columnType: "float",
      allowNull: true,
    },
    order_type: {
      type: "string",
      allowNull: true,
    },
    mov_rule_id:{
      type: "number",
      allowNull: true,
      columnType: "integer",
    },
  },
  updateAndCreateHistory: function (
    criteria,
    toUpdate,
    updatedBy = null,
    updatedByRole = null,
    batchId = null
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!_.isEmpty(criteria)) {
          let history = await Order.find(criteria).limit(1).populate("order_items");
          history = history[0];
          old_order = JSON.stringify(history);
          sails.log.debug(
            `OrderID: ${criteria.id} Updating order Status: ${toUpdate.status_id}`,
          );
          if (toUpdate.cash_received) {
            toUpdate.cash_received = Math.round(toUpdate.cash_received * 100) / 100;
          }
          const updatedOrder = await Order.update(criteria, toUpdate);
          sails.log.info(
            `OrderID: ${criteria.id} Updated status: ${toUpdate.status_id} History status: ${history.status_id}`,
          );
          if (
            toUpdate.status_id &&
            history.status_id &&
            toUpdate.status_id != history.status_id
          ) {
            sails.log.info(`OrderID: ${criteria.id} Creating status history`);
            const s_his = await OrderStatusHistory.create({
              order_id: history.id,
              status_id: toUpdate.status_id
                ? toUpdate.status_id
                : history.status_id,
              updated_by: updatedBy,
              updated_by_role: updatedByRole,
              batch_id: batchId
            });
            sails.log.info(
              `OrderID: ${criteria.id} Status history: ${JSON.stringify(s_his)}`,
            );
          }
          sails.log.info(`OrderID: ${criteria.id} Creating history`);
          const result = await OrderHistory.create({
            order_id: history.id,
            status_id: toUpdate.status_id
              ? toUpdate.status_id
              : history.status_id,
            total_price: toUpdate.total_price
              ? toUpdate.total_price
              : history.total_price,
            oldOrderJSON: old_order,
            newOrderJSON: JSON.stringify(toUpdate),
          });
          sails.log.debug(
            `OrderID: ${criteria.id} Updated order: ${JSON.stringify(
              updatedOrder,
            )}`,
          );
          resolve(updatedOrder);
        } else {
          sails.log.error(`could not update the order, criteria supplied was empty -> ${JSON.stringify(criteria)}`);
          reject(`could not update the order, criteria supplied was empty -> ${JSON.stringify(criteria)}`);
        }
      } catch (err) {
        sails.log.warn(`OrderID: ${criteria.id} Error at creating history: ${JSON.stringify(err.stack || err)}`);
        reject(err);
      }
    });
  },
  beforeCreate: (valuesToSet, next) => {
    valuesToSet.uuid = uuid4();
    next();
  },
  afterCreate: (data, next) => {
    clearCache(data).then(e => next());
  },
  afterUpdate: (data, next) => {
    clearCache(data).then(e => next());
  },
  afterDestroy: (data, next) => {
    clearCache(data).then(e => next());
  },
};

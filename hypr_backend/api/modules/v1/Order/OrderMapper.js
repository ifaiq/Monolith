
const moment = require("moment");
const camelcaseKeys = require("camelcase-keys");
const { MultiLingualAttributes } = require("../../../constants/enums");
const { getLanguage } = require("../../../../utils/languageAccessor");
const { TAX_CATEGORIES: { TAX_ON_PRICE } } = require("../../../services/Constants.js");


/**
 * This method is responsible to create an object for order table.
 * It will be invoked when customer create order for himself.
 * @param payload is the request received by app
 * @param customerId is id extracted from access token
 * @param priceDetails an object containing all billing related details like: total, tax, couponId, discount
 * @returns order object
 */
const toOrderEntity = (
  payload, customerId, priceDetails,
  deliveryAndServiceCharges, deviceId, appVersion, shipmentId = null,
  location,
  couponProductsTotal = null,
  movRuleId,
) => ({
  // Basic info
  location_id: payload.locationId,
  customer_id: customerId,
  device_id: deviceId,
  app_version: appVersion,
  placed_at: new Date(),
  disabled: false,
  payment_type: payload.paymentType || "COD",
  // TODO get customer information from the data base | to discussed.
  customer_address_id: payload.deliveryAddressId,
  delivery_time: new Date(JSON.parse(payload.deliveryTime)),
  service_charge_type: deliveryAndServiceCharges.serviceChargeType,
  service_charge_value: deliveryAndServiceCharges.serviceChargeValue,
  delivery_charge_type: deliveryAndServiceCharges.deliveryChargeType,
  delivery_charge_value: deliveryAndServiceCharges.deliveryChargeValue,
  sales_agent_id: payload.salesAgentId || null,
  delivery_boy_id: payload.delivery_boy_id || null,
  order_type: payload.order_type || null,
  mov_rule_id: movRuleId || null,

  // Derived values
  tax: 0, // done zero purposely as the order table tax needs to be set zero for all casess
  // priceDetails.grandTotal is coming from Order Service v1 which is actually subTotal
  total_price: priceDetails.subTotal || priceDetails.grandTotal || 0,
  coupon_id: priceDetails.couponId || null,
  coupon_discount: priceDetails.couponDiscount || 0,
  credit_buy_fee: priceDetails.creditBuyFee || 0,
  volume_based_discount: priceDetails.volumeBasedDiscount || 0,

  // Default values
  status_id: Constants.HyprOrderStates.RESERVED,

  // ShipmentId
  shipment_id: shipmentId,
  location_delivery_charges: location.deliveryChargeValue,
  location_free_delivery_limit: location.freeDeliveryLimit,

  coupon_products_total: couponProductsTotal,
});

/**
 * This method responsible to return list of items that we need to associate with an order
 * @param orderId where we need to associate items
 * @param productQuantityList list we want to associate
 * @returns list of order items
 */
const toOrderItemsEntity = (orderId, productQuantityList) =>
  productQuantityList.map(productQuantity => {
    const { product, quantity } = productQuantity;

    return {
      order_id: orderId,
      product_id: product.id,
      original_quantity: quantity,
      quantity: quantity,
      price: product.price,
      tax: product.tax,
      tax_category: product.taxCategory,
      discount: product.discount,
      // TODO leverage adjusted values to gather data points
      adjusted_discount: product.adjustedDiscount,
      adjusted_tax: product.adjustedTax,
      adjusted_price: product.adjustedPrice,
      mrp: product.mrp,
      tax_percentage: product.taxPercent,
      name: product.name,
      volume_based_price: product.volumeBasedPrice,
      volume_based_price_tax: product.volumeBasedPriceTax,
      volume_based_discount: product.volumeBasedDiscount,
      pricing_rule_history_id: product.dynamicPriceHistoryId || null,
    };
  });

/**
 * This method takes the orderId, statusId and return the OrderStatusHistoryEntity.
 *
 * @param {Number} orderId
 * @param {Number} statusId
 * @returns {Object} OrderStatusHistoryEntity
 */
const toOrderStatusHistoryEntity = (orderId, statusId, userId, roleId, deviceId = null, batchId = null) => ({
  order_id: orderId,
  status_id: statusId,
  updated_by: userId,
  updated_by_role: roleId,
  device_id: deviceId,
  batch_id: batchId,
});

/**
 * This method takes the orderId, statusId, total, order, updatedOrder and return the OrderHistoryEntity.
 *
 * @param {Number} orderId
 * @param {Number} statusId
 * @param {Decimal|Number} total
 * @param {Object} order
 * @param {Object} updatedOrder
 * @returns {Object} OrderHistoryEntity
 */
const toOrderHistoryEntity = (orderId, statusId, total, order, updatedOrder) => ({
  order_id: orderId,
  status_id: statusId,
  total_price: total,
  oldOrderJSON: JSON.stringify(order),
  newOrderJSON: JSON.stringify(updatedOrder),
});

/**
 * Responsible for enable invoice button
 * @param statusId
 * @param batchStatusId
 * @returns boolean
 */
const checkEnableDownloadEInvoice = (statusId, batchStatusId, time, isInvoiceDownloadedAtLogistics) => {
  if (
    isInvoiceDownloadedAtLogistics &&
    (statusId === Constants.HyprOrderStates.DELIVERED ||
      statusId === Constants.HyprOrderStates.PARTIAL_DELIVERED)
  ) {
    return true;
  }

  return batchStatusId === Constants.DeliveryBatchStates.CLOSED &&
    (statusId === Constants.HyprOrderStates.DELIVERED ||
      statusId === Constants.HyprOrderStates.PARTIAL_DELIVERED) &&
    getIsOrderPlacedAfterDec2021(time);
};

// DTOs
/**
* This method is responsible to build orderDto
* @param order entity
* @param orderItems list in the order
* @param orderStatusHistory containing history of different statuses
* @returns {Object} order, items and history
*/
const toOrderDto = (order, orderItems, orderStatusHistory, batchStatusId) => {
  const orderDto = {
    id: order.id,
    status: sails.__(Constants.HyprOrderStates.getKeyFromValue(order.statusId).replace(/_/g, " ")),
    statusId: order.statusId,
    serviceCharges: order.serviceCharges,
    deliveryTime: order.deliveryTime,
    deliveryCharges: order.deliveryChargeValue,
    paymentType: order.paymentType,
    discount: (order.couponDiscount + (order.volumeBasedDiscount || 0)).toFixed(2),
    couponDiscount: (order.couponDiscount || 0).toFixed(2),
    volumeBasedDiscount: (order.volumeBasedDiscount || 0).toFixed(2),
    placedAt: order.placedAt,
    creditBuyFee: order.creditBuyFee,
    waiverAmount: order.waiverAmount || 0,
    totalPayment: parseFloat(order.totalPrice.toFixed(2)),
    grandTotal: parseFloat(order.grandTotal.toFixed(2)),
    batchStatusId,
    salesAgentId: order.salesAgentId,
    feedback: order.feedback,
    showFeedbackForm: order.showFeedbackForm,
    tax: order.tax,
    orderType: order.orderType,
  };

  if (order.couponId && order.couponDiscount > 0) {
    orderDto.coupon = {
      id: order.couponId,
    };
  }

  orderDto.products = [];
  for (const orderItem of orderItems) {
    orderDto.products.push(toOrderItemDto(orderItem, orderItem.productId));
  }

  orderDto.history = [];
  for (const orderHistory of orderStatusHistory) {
    orderDto.history.push({
      status: sails.__(Constants.HyprOrderStates.getKeyFromValue(orderHistory.statusId).replace(/_/g, " ")),
      date: orderHistory.createdAt,
    });
  }

  orderDto.customerInfo = {
    name: order.customerInfo?.name,
    phone: order.customerInfo?.phone,
    shopName: order.customerShopInfo?.shop_name,
  };

  orderDto.enableDownloadInvoiceButton = checkEnableDownloadEInvoice(
    order.statusId,
    batchStatusId,
    orderDto.placedAt,
    order.isInvoiceDownloaded,
  );

  return orderDto;
};

/**
 * This method is responsible to build toOrderItemDto
 * @param orderItem in the order
 * @param product details
 * @returns {{quantity: *, price: *, name: *, id: *}}
 */
const toOrderItemDto = (orderItem, product) => {
  // TODO REMOVE CALCULATION PART FROM DTO FUNCTION.
  const price = orderItem.price;
  const tax = orderItem.tax;
  const consumerPrice = parseFloat((price + tax).toFixed(2));
  const priceWithoutTax = parseFloat(price.toFixed(2));
  const totalPrice =
    !product.taxInclusive && orderItem.taxCategory === TAX_ON_PRICE
      ? parseFloat((priceWithoutTax * orderItem.quantity).toFixed(2))
      : parseFloat((consumerPrice * orderItem.quantity).toFixed(2));
  let localName;
  if (product.multilingual) {
    localName = product.multilingual.find(
      obj =>
        obj.language === getLanguage() &&
        obj.attributeName === MultiLingualAttributes.NAME,
    );
  }
  return {
    orderItemId: orderItem.id,
    productId: orderItem.productId.id,
    name: localName ? localName.value : product.name,
    image: product.imageUrl,
    quantity: orderItem.quantity,
    price: priceWithoutTax,
    totalPrice: totalPrice,
    removed: orderItem.removed ? true : false,
    isVolumeBasedPriceEnabled: orderItem.volumeBasedPrice ? true : false,
    ...(!product.taxInclusive && { tax }),
  };
};

/**
 * This method is responsible to build toGetOrderStatuses
 * @param orders
 * @returns {{Array[]}} id, status and placedAt
 */
const toOrderStatusesDto = orders => orders.map(order => ({
  id: order.id,
  status: sails.__(order.statusId.name),
  statusId: order.statusId.id,
  date: order.placedAt,
}));

/**
 * This method is responsible for building OrderItemsForEmail
 *
 * @param {Object} productQuantityList
 * @returns {Object} orderItemsForEmail
 */
const toOrderItemsForEmail = (productQuantityList, createdOrderItems) =>
  productQuantityList.reduce((mappedArray, product, index) => {
    const productOut = {
      product_name: productQuantityList[index].product.name,
      product_sku: productQuantityList[index].product.sku,
      quantity: parseInt(createdOrderItems[index].product.quantity),
      total_price:
        parseInt(createdOrderItems[index].product.quantity) *
        (parseFloat(productQuantityList[index].product.price) +
          parseFloat(productQuantityList[index].product.tax)),
    };
    mappedArray[index] = productOut;
    return mappedArray;
  }, []);

/**
 * This method is responsible for building OrderInfoForEmail
 *
 * @param {Object} createdOrder
 * @param {Object} location
 * @param {Object} customerInfo
 * @param {Object} orderItemsForEmail
 * @returns {Object} orderInfoForEmail
 */
const toOrderInfoForEmail = (createdOrder, location, customerInfo, orderItemsForEmail) => {
  const orderOut = {
    order_id: createdOrder.id,
    store_name: location.name,
    customer_name: customerInfo.name,
    customer_phone: customerInfo.phone,
    tax: parseFloat(createdOrder.tax),
    sub_total: parseFloat(createdOrder.totalPrice) - parseFloat(createdOrder.tax),
    tip: parseFloat(createdOrder.tipAmount),
    s_d_charges: parseFloat(createdOrder.serviceChargeValue) + parseFloat(createdOrder.deliveryChargeValue),
    grand_total: parseFloat(createdOrder.totalPrice),
    items: orderItemsForEmail,
  };
  return orderOut;
};

/**
 * Responsible for preparing place order sms
 * @param orderId
 * @param orderAmount
 * @returns {{args: [*, *], message: *}}
 */
const toPlaceOrderSMS = (orderId, orderAmount) => ({
  message: sails.__("customer_order_placed"),
  args: [orderId, orderAmount],
});

/**
 * Responsible for prepare object for sending SMS
 * @param customer
 * @returns {{send_to: *, business_unit_id: *, company_id: *}}
 */
const customerToSendSMS = customer => ({
  company_id: customer.companyId,
  business_unit_id: customer.businessUnitId,
  send_to: customer.phone,
});

/**
 *
 * @param {string} time
 * @description Returns true if order has been placed after 4th December, 2021
 * @returns {boolean}
 */
getIsOrderPlacedAfterDec2021 = time => {
  if (!time) return false;
  return moment(time, "YYYY/MM/DD").valueOf() >= moment("2021/12/04", "YYYY/MM/DD").valueOf();
};

/**
*
* @param {object} order
* @description return the order data which need to be send in sns
* @returns {object}
*/

const orderInfoToPublish = order => {
  const parseCamelCase = camelcaseKeys(order);
  const {
    customerId = null,
    totalPrice = null,
    statusId = null,
    id = null,
    couponDiscount = null,
    creditBuyFee = null,
    waiverAmount = null,
    salesAgentId = null,
    volumeBasedDiscount = 0,
  } = parseCamelCase;

  sails.log(`Context orderInfoToPublish sending data to sns ---> payload ${JSON.stringify({
    customerId,
    orderId: id,
    orderAmount: totalPrice,
    statusId,
    couponDiscount,
    creditBuyFee,
    waiverAmount,
    salesAgentId,
    volumeBasedDiscount,
  })}`);

  return {
    customerId,
    orderId: id,
    orderAmount: totalPrice,
    statusId,
    couponDiscount,
    creditBuyFee,
    waiverAmount,
    salesAgentId,
    volumeBasedDiscount,
  };
};

const orderMapper = (orders = []) => orders.map(order => ({
  id: order.id,
  customerId: order.customerId,
  totalPrice: order.totalPrice,
  placedAt: order.placedAt,
  locationId: order.locationId,
  customerAddressId: order.customerAddressId,
  paymentType: order.paymentType,
  deliveredTime: order.deliveredTime,
  statusId: order.statusId,
  status: Constants.HyprOrderStates.getOrderStatusFromId(order.statusId),
  statusReasonId: order.statusReasonId,
  subTotal: order.subTotal,
  deliveryCharge: order.deliveryChargeValue,
  serviceCharge: order.serviceChargeValue,
  orderType: order.orderType,
}));

const priceMappingForSpotsaleProduct = (products, productList) => {
  for (const item of products) {
    const productIndex = productList.findIndex(x => +x.id === +item.id);
    if (productIndex >= 0) {
      productList[productIndex].price = item.price;
      productList[productIndex].taxInclusive = true;
      productList[productIndex].isVolumeBasedPriceEnabled = false;
    }
  }
  return productList;
};

module.exports = {
  toOrderEntity,
  toOrderItemsEntity,
  toOrderDto,
  toOrderItemDto,
  toOrderStatusHistoryEntity,
  toOrderHistoryEntity,
  toOrderStatusesDto,
  toOrderItemsForEmail,
  toOrderInfoForEmail,
  toPlaceOrderSMS,
  customerToSendSMS,
  orderInfoToPublish,
  orderMapper,
  priceMappingForSpotsaleProduct,
};

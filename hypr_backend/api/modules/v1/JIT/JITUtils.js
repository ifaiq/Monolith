/**
 Copyright © 2021 Retailo, Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
const { dayjs, getDayName } = require("./days");
const { TIMEZONES } = require("../../../services/Constants.js");
const { arithmos: { getJITOrderCalculations } } = require("../Arithmos");
const { DAYOFF, JIT_PRODUCTS_SUPPORT_MINIMUM_VERSION } = require("./Constants");
const { getServiceCharge, getDeliveryCharge, roundAccurately } = require("../Arithmos/Arithmos");
const Big = require("big.js");
const { checkFreeDeliveryElgibleFee } = require("../Arithmos/Helpers/PriceCalculation");

/**
 * Adjust Off days and move delivery to next working day
 * @param {Date} deliveryDate
 * @param {Array} daysOff
 */
const adjustOffDays = (deliveryDate, daysOff = []) => {
  let adjustedDate = deliveryDate;
  while (daysOff.includes(getDayName(adjustedDate))) {
    adjustedDate = adjustedDate.add(24, "hour");
  }
  return adjustedDate;
};

/**
   * Function that sorts the product quantity list by JIT hours
   * @param productQuantityList: object
 */
const sortJITProductsByDeliveryDate = productQuantityList => {
  productQuantityList.sort((productA, productB) =>
    (productA.product.deliveryTime || 24) - (productB.product.deliveryTime || 24));
};

/**
 * Function returns the Delivery Date according to the JIT value provided
 * @param {Number} JIT_hours
 * @param {String} country_code
 * @returns {Object}
 */
const getDeliveryDate = (JIT_hours, country_code, deliverySlotsEnabled = false, calculateDaysOff = true) => {
  const orderDate = dayjs().tz(TIMEZONES[country_code]);
  // In case of normal delivery, JIT value is 0.
  const adjustedJitHours = JIT_hours || 0;
  let hoursInADay = 24;

  if (!adjustedJitHours && deliverySlotsEnabled) {
    hoursInADay = 6;
  }
  let adjustedProcurementDate;
  let deliveryDate;

  // Incase adjustedJitHours greater than hoursInADay we need to take care of procurement day
  // as the item is not in the warehouse yet.
  if (adjustedJitHours > hoursInADay) {
    // calculate procurement time by subtracting delivery time
    const procurementTime = adjustedJitHours - hoursInADay;
    const procurementDate = orderDate.add(parseInt(procurementTime), "hour");

    adjustedProcurementDate = adjustOffDays(procurementDate, calculateDaysOff ? DAYOFF[country_code] : []);

    deliveryDate = adjustedProcurementDate.add(parseInt(hoursInADay), "hour");
  } else {
    // For JIT items with JIT_hours less than or equal to 24 only JIT_hours are added to calculate delivery date
    // and for non JIT item we simply 24hrs to calculate delivery date
    deliveryDate = adjustedJitHours === 0
      ? orderDate.add(parseInt(hoursInADay), "hour")
      : orderDate.add(parseInt(adjustedJitHours), "hour");
  }


  // Handling the week day off
  const adjustedDeliveryDate = adjustOffDays(deliveryDate, calculateDaysOff ? DAYOFF[country_code] : []);
  return {
    deliveryDate: adjustedDeliveryDate.format("ddd, MMM DD"),
    timeInMilliSeconds: adjustedDeliveryDate.format("x"),
  };
};

/**
   * Function creates a new product List grouped by JIT(s).
   * @param {Object} productQuantityList: object
   * @param {Object} country_code: object
   * @returns object
   */
const getProductListByJIT = (
  productQuantityList,
  country_code,
  deliverySlotsEnabled = false,
  calculateDaysOff = true,
) => {
  const JITProductList = {};
  sortJITProductsByDeliveryDate(productQuantityList);
  productQuantityList.map(obj => {
    const { deliveryDate, timeInMilliSeconds } = getDeliveryDate(
      obj.product.deliveryTime,
      country_code,
      deliverySlotsEnabled,
      calculateDaysOff,
    );

    if (JITProductList[deliveryDate]) {
      JITProductList[deliveryDate].push({
        quantity: obj.quantity, product: { ...obj.product, timeInMilliSeconds },
      });
    } else {
      JITProductList[deliveryDate] = [{
        quantity: obj.quantity, product: { ...obj.product, timeInMilliSeconds },
      }];
    }
  });
  return JITProductList;
};

/**
 * Function creates a new JIT Cart
 * @param cart: object
 * @param productList: object
 * @returns object
 */
const createJITShipment = (cart, currency, productList, isBatchFlow = false) => {
  newshipment = {};
  newshipment.locationId = cart.locationId || cart.location.id;
  newshipment.paymentType = cart.paymentType;
  newshipment.retailerId = cart.retailerId || cart.customerId;
  newshipment.products = productList.map(({ product }) => product.id || product.productId);
  deliveryChargeValue = cart.deliveryAndServiceCharges?.deliveryChargeValue || 0;
  serviceChargeValue = cart.deliveryAndServiceCharges?.serviceChargeValue || 0;
  waiver = cart.waiver || 0;
  const {
    tax,
    total,
    grandTotal,
    subTotal,
    amountPayable,
    discount,
    volumeBasedDiscount = 0,
  } = getJITOrderCalculations(
    productList,
    {
      deliveryChargeValue,
      serviceChargeValue,
    },
    isBatchFlow,
    waiver,
  );
  newshipment.tax = tax;
  newshipment.total = total;
  newshipment.discount = discount;
  newshipment.grandTotal = grandTotal;
  newshipment.subTotal = subTotal;
  newshipment.amountPayable = amountPayable;
  newshipment.volumeBasedDiscount = volumeBasedDiscount;
  return newshipment;
};

/**
 * Functions returns a object with order details and total calculations for the order
 * @param {Object}
 * @returns {Object}
 */
const fetchOrderCalculations = ({
  order,
  currency,
  productList,
  couponId,
  customerId,
  deliveryAndServiceCharges,
  creditBuyFee,
}) => {
  subOrder = {
    order: {},
    totalCalculations: {},
  };
  subOrder.order.coupon = { ...order.coupon };
  subOrder.order.customerId = customerId;
  subOrder.order.deliveryAddressId = order.deliveryAddressId;
  subOrder.order.deliveryTime = productList[0].product?.timeInMilliSeconds;
  subOrder.order.locationId = order.locationId;
  subOrder.order.paymentType = order.paymentType;
  subOrder.order.products = productList.map(({ product }) => product.id);
  const { tax, subTotal, grandTotal, discount, volumeBasedDiscount = 0 } = getJITOrderCalculations(
    productList,
    deliveryAndServiceCharges,
  );
  subOrder.totalCalculations.tax = tax || 0;
  subOrder.totalCalculations.grandTotal = grandTotal || 0;
  subOrder.totalCalculations.subTotal = subTotal || 0;
  subOrder.totalCalculations.couponDiscount = discount || 0;
  subOrder.totalCalculations.couponId = couponId;
  subOrder.totalCalculations.creditBuyFee = creditBuyFee || 0;
  subOrder.totalCalculations.volumeBasedDiscount = volumeBasedDiscount;
  subOrder.order.salesAgentId = order.salesAgentId || null;
  subOrder.order.delivery_boy_id = order.delivery_boy_id || null;
  return subOrder;
};

/**
 * Fetch and divide shipment charges on total shipments
 * @param {Object} location
 * @param {Integer} shipmentsLength
 */
const fetchDeliveryAndServiceCharges = (location, total, shipmentsLength, tax, order = {}) => {
  let { deliveryChargeValue,
    serviceChargeValue,
    serviceChargeType,
    deliveryChargeType,
    freeDeliveryLimit,
  } = location;

  /**
   * Use delivery & service charges applicable at the time of order creation
   */
  if (order && order.id) {
    ({
      locationDeliveryCharges: deliveryChargeValue,
      serviceChargeValue,
      locationFreeDeliveryLimit: freeDeliveryLimit,
      serviceChargeType,
      deliveryChargeType,
    } = order);
  }

  let deliveryCharges;
  deliveryCharges = getDeliveryCharge(
    deliveryChargeType, deliveryChargeValue,
    total,
  );
  const freeDeliveryEligibleFee = checkFreeDeliveryElgibleFee(total, tax);

  if (freeDeliveryLimit > 0 && freeDeliveryEligibleFee >= freeDeliveryLimit) {
    deliveryCharges = 0.00;
  }

  const serviceCharges = getServiceCharge(
    serviceChargeType, serviceChargeValue,
    total,
  );
  /**
   * Delivery charges for each shipment are obtained by dividing the total charges by total number of shipments
   */
  return {
    serviceChargeValue: roundAccurately(parseFloat(Big(serviceCharges || 0).div(Big(shipmentsLength))), 2),
    deliveryChargeValue: roundAccurately(parseFloat(Big(deliveryCharges || 0).div(Big(shipmentsLength))), 2),
    serviceChargeType,
    deliveryChargeType,
  };
};

/*
* Function determines minimum app version support for JIT APIS
* @params userAppVersion: string
* @param os: string
* @returns boolean
*/
const checkJITStatusBasedOnAppVersion = (userAppVerison = "", os = "") => {
  let minimumSupportedVersionBreakdown = "";
  if (userAppVerison === JIT_PRODUCTS_SUPPORT_MINIMUM_VERSION) {
    return true;
  }
  if (os.toLowerCase() === "android") {
    minimumSupportedVersionBreakdown = JIT_PRODUCTS_SUPPORT_MINIMUM_VERSION.split(".");
  } else if (os.toLowerCase() === "ios") {
    return true; // All IOS versions support JIT
  }
  const userVersionBreakdown = userAppVerison.split(".");

  for (let i = 0; i < userVersionBreakdown.length; i++) {
    if (+userVersionBreakdown[i] > +minimumSupportedVersionBreakdown[i]) {
      return true;
    }
  }
  return false;
};

module.exports =
{
  createJITShipment,
  getProductListByJIT,
  fetchOrderCalculations,
  getDeliveryDate,
  fetchDeliveryAndServiceCharges,
  checkJITStatusBasedOnAppVersion,
};

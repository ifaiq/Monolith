const Big = require("big.js");

const {
  couponTypes: {
    PERCENTAGE,
    FIXED_AMOUNT,
    FREE_DELIVERY,
    REMOVE_SERVICE_CHARGES,
  },
  errors: { MIN_VALUE_FOR_COUPON, MIN_VALUE_FOR_COUPON_WL_BL, MIN_COUPON_LIMIT_BATCH_FLOW },
} = require("../../Coupon");
const {
  COUPON_SKU_LIST_TYPE: { WHITELIST_SKUS, BLACKLIST_SKUS },
} = require("../../../../services/Constants.js");
const { globalConf: {
  MOV_LIMIT_BYPASSED: movLimitBypassed,
} } = require("../../../../../config/globalConf");

const { roundAccurately, convertFromBaseCurrency } = require("./calculationsUtils");

/**
 * Function calculates the coupon discount that can be applied to the order.
 * @param coupon: the coupon object in the cart
 * @param total: price for eligible products
 * @param serviceCharges: price for service charges
 * @param deliveryCharges: price for delivery charges
 * @returns object
 */
const calculateDiscount = ({
  coupon,
  total,
  serviceCharges,
  deliveryCharges,
  isBatchFlow,
  baseCurrencyMultiplier,
  eligibleProductsOrderedPrice,
}) => {
  const logIdentifier = "DiscountCalculation.calculateDiscount()";
  sails.log(`${logIdentifier}: coupon: ${JSON.stringify(coupon)}`,
    `total: ${total}, isBatchFlow: ${isBatchFlow}, baseCurrencyMultiplier: ${baseCurrencyMultiplier}`);

  if (_.isEmpty(coupon)) {
    throw Error(`${logIdentifier}: Invalid/Empty coupon`);
  }

  const couponType = parseInt(coupon.discountType.id ?? coupon.discountType);
  let discount = 0;
  let uncappedDiscount = 0;
  if (total < parseFloat(coupon.minCouponLimit) &&
    (isBatchFlow ? !movLimitBypassed && !eligibleProductsOrderedPrice : true)
  ) {  // if order value is less than min limit for coupon
    return couponLimitMessage({ coupon, isBatchFlow, discount, uncappedDiscount, baseCurrencyMultiplier });
  }
  if (couponType === FIXED_AMOUNT) {
    const couponDiscountValue = coupon.discountValue;
    discount = parseFloat((couponDiscountValue));
    if (isBatchFlow && total < coupon.minCouponLimit) {
      discount = (total * discount) / eligibleProductsOrderedPrice;
    }
    if (total - discount < 0) {
      discount = total;
    }
  } else if (couponType === PERCENTAGE) {
    const discountPercentage = parseFloat((coupon.discountValue / 100));
    discount = parseFloat(((total * discountPercentage)));
  } else if (couponType === FREE_DELIVERY) {
    discount = parseFloat(deliveryCharges);
  } else if (couponType === REMOVE_SERVICE_CHARGES) {
    discount = parseFloat(serviceCharges);
  }
  if (coupon.maxDiscountValue !== 0 && discount >= parseFloat(coupon.maxDiscountValue)) {
    uncappedDiscount = discount;
    discount = parseFloat(coupon.maxDiscountValue);
  } else {
    uncappedDiscount = discount;
  }
  return { discount: roundAccurately(discount, 2), uncappedDiscount: roundAccurately(uncappedDiscount, 2) };
};

/**
 * Function calculates discount according to trade price and price
 * @param {Number} tradePrice
 * @param {Number} price
 * @returns {Number} discount
 */
// TODO investigate why is this a part of discount service.
const calculateDiscountOnTradePrice = (tradePrice, price) =>
  roundAccurately(parseFloat(((tradePrice - price) / tradePrice) * 100), 2);

/**
 * Function calculates discount for product
 * @param {Number} price
 * @param {Number} tax
 * @param {Number} discountValue
 * @param {Number} total
 * @param {Number} uncappedDiscount
 * @returns {Number} discountForProduct
 * @returns {Number} uncappedDiscountForProduct
 * @returns {Number} consumerPriceAfterDiscount
 */
const calculateProductDiscount = (price, tax, discountValue, total, uncappedDiscount) => {
  const productPrice = Big(price).plus(tax);
  const priceContribution = productPrice.div(Big(total))
    .toString();// divide(productPrice,$.of(total)); // percentage of product price contribution to total.
  const discountForProduct = parseFloat(
    Big(discountValue).times(priceContribution),
  ); // discount value for this a product with ratio to its contribution.
  const uncappedDiscountForProduct = parseFloat(
    Big(uncappedDiscount).times(priceContribution),
  ); // discount value for this a product with ratio to its contribution.
  const consumerPriceAfterDiscount = parseFloat(productPrice.minus(discountForProduct));
  return { discountForProduct, uncappedDiscountForProduct, consumerPriceAfterDiscount };
};

/**
 * Function removes discount from the order
 * @param Object
 * @returns Object
 */
const couponLimitMessage = ({ coupon, isBatchFlow, discount, uncappedDiscount, baseCurrencyMultiplier }) => {
  const { productsListType } = coupon;
  if (isBatchFlow) {
    return {
      discount: convertFromBaseCurrency(discount, baseCurrencyMultiplier),
      uncappedDiscount: convertFromBaseCurrency(uncappedDiscount, baseCurrencyMultiplier),
      couponValidation: MIN_COUPON_LIMIT_BATCH_FLOW(
        convertFromBaseCurrency(coupon.minCouponLimit, baseCurrencyMultiplier)).message,
    };
  }
  // TODO Need to remove the `data` object. We need to update the error.js file to update the error responses.
  throw {
    data: {
      couponValidation:
        productsListType === WHITELIST_SKUS ||
        productsListType === BLACKLIST_SKUS
          ? MIN_VALUE_FOR_COUPON_WL_BL()
          : MIN_VALUE_FOR_COUPON(
            convertFromBaseCurrency(coupon.minCouponLimit, baseCurrencyMultiplier),
          ),
    },
  };
};

module.exports = { calculateDiscount, calculateDiscountOnTradePrice, calculateProductDiscount };

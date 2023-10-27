// Dao imports
const { findByCustomerId, findById, find, validateCouponProducts } = require("./CouponDao");
const couponUsageHistoryDao = require("./CouponUsageHistoryDao");

// Constants imports
const {
  errors: {
    NO_PRODUCTS_ELIGIBLE,
  },
} = require("./Errors");

/**
 * Function finds coupon by name
 * @param name
 * @returns [Coupons]
 */
const findCouponByNameAndLocationId = async (name, locationId) => await find({ name, locationId, disabled: false });

/**
 * Function finds coupon by id
 * @param id
 * @returns [Coupons]
 */
const findCouponByUnCheckedId = async (id, orderId) => {
  const response = await findById(id);
  return response;
};

/**
 * Function determines products that are eligible for discount for a coupon
 * @param coupon: Object,
 * @param: productQuantityList: Array[Object]
 * @returns Object: { eligibleList, ineligibleList, productsListType}
 */
const findEligibleProducts = async (coupon, productQuantityList) => {
  const { id, productsListType } = coupon;

  const validationResponse = await validateCouponProducts(
    {id}, productQuantityList.map(({product}) => ({id: product.productId || product.id })));

  if (validationResponse.eligibleProducts.length === 0) {
    throw { data: NO_PRODUCTS_ELIGIBLE() };
  }

  const eligibleList = [];
  const ineligibleList = [];

  productQuantityList.forEach(productQuantityObj => {
    const { product } = productQuantityObj;
    (validationResponse.eligibleProducts.find(
      ({ id: productId }) =>
        product.id === productId || product.productId === productId,
    )
      ? eligibleList
      : ineligibleList
    ).push(productQuantityObj);
  },
  );

  return { eligibleList, ineligibleList, productsListType };
};

/**
 * Function passes couponUsageHistory to DAO
 *
 * @param {Object} couponUsageHistory
 */
const createCouponUsageHistory = async couponUsageHistory =>
  await couponUsageHistoryDao.create(couponUsageHistory.coupon_id, couponUsageHistory);

/**
 * This function returns all discounts offered to customer
 * @param {Number} customerId
 * @returns {Array[]} discountsOffered
 */
const getDiscountsOfferedToCustomer = async customerId => {
  const coupons = await findByCustomerId(customerId);
  return coupons.length
    ? coupons
      .map(
        coupon =>
          `${coupon.discountValue
          }_${Constants.CouponDiscountTypes.getCouponTypeFromId(
            coupon.discountType.id ?? coupon.discountType,
          )}`,
      )
      .join()
    : "";
};

module.exports = {
  findCouponByNameAndLocationId,
  findEligibleProducts,
  createCouponUsageHistory,
  findCouponByUnCheckedId,
  getDiscountsOfferedToCustomer,
};

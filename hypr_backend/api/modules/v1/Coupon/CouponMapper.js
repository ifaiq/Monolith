
/**
 * Function
 *
 * @params {}
 * @returns {}
 */
const toCouponUsageHistoryEntity = (couponId, customerId, orderId, discountValue, discountType) => ({
  coupon_id: couponId,
  customer_id: customerId,
  order_id: orderId,
  discount_value: discountValue,
  discount_type_id: discountType.id ?? discountType,
  date: new Date(),
});

module.exports = {
  toCouponUsageHistoryEntity,
};

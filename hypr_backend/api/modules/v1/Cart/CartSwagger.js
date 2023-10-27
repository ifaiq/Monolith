/* eslint-disable max-len */
const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./CartJoiValidation");
const { getSwaggerSchema } = require("../../../../swagger/utils");


const getCartValidationSchema = {
  summary: "Returns customer's cart [Consumer]",
  description: `**Role(s) allowed:** 
  - Customer (8)
  - Sales agent (16)
  
  \n **Communicates with:**
   - **Redis service** to fetch customer's cart details`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.getCartValidation).swagger),
};

const updateCartValidationSchema = {
  summary: "Returns cart details i.e. cart shipments, discounts, cart total etc [Consumer]",
  description: `**Role(s) allowed:** 
  - Customer (8)
  - Sales agent (16)
  
  This API returns cart details in response which includes below and more:
  - grandTotal
  - subTotal
  - total
  - couponDiscount
  - eligibleProducts
  - couponValidation
  - amountPayable
  - deliveryAndServiceCharges
  - volumeBasedDiscount
  - remainingPriceForFreeDelivery

  \n **May communicate with**:
   - **Coupon service** to validate and create coupon usage history if coupon is applied on the order
   - **Config service** to fetch location and business unit details
   - **Wallet service** for CREDIT orders
   - **User service** to fetch customer/shop related details
   - **LMS service** for CREDIT orders for loan related applications
   - **Redis service** to update cart`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.putCartValidation).swagger),
};

const updateCartForExternalResourceSchema = {
  summary: "Returns cart details i.e. cart shipments, discounts, cart total etc [s2s]",
  description: `s2s token required

 This API returns cart details in response which includes below and more:
  - grandTotal
  - subTotal
  - total
  - couponDiscount
  - eligibleProducts
  - couponValidation
  - amountPayable
  - deliveryAndServiceCharges
  - volumeBasedDiscount
  - remainingPriceForFreeDelivery

  \n **May communicate with**:
   - **Coupon service** to validate and create coupon usage history if coupon is applied on the order
   - **Config service** to fetch location and business unit details
   - **Wallet service** for CREDIT orders
   - **User service** to fetch customer/shop related details
   - **LMS service** for CREDIT orders for loan related applications
   - **Redis service** to update cart`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.putCartValidation).swagger),
};

const generateCartValidationSchema = {
  summary: "Post order flow - Returns the updated order (coupon discount, total etc) on changing order status (PD/Onhold etc) [Logistics]",
  description: `**Role(s) allowed:** 
  - Delivery agent (6)
  
  Returns the updated order details (coupon discount, total etc) against the provided order Id
  
  \n **May communicate with**:
   - **Coupon service** to validate and create coupon usage history if coupon is applied on the order
   - **Config service** to fetch location and business unit details
   - **Wallet service** for CREDIT orders
   - **User service** to fetch customer/shop related details
   - **LMS service** for CREDIT orders for loan related applications`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.generateCartValidation).swagger),
};

module.exports = {
  getCartValidationSchema,
  updateCartValidationSchema,
  updateCartForExternalResourceSchema,
  generateCartValidationSchema,

};

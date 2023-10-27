const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./OrderJoiValidation");
const { getSwaggerSchema } = require("../../../../swagger/utils");

const postOrderValidationSchema = {
  summary: "Places new order(s) for customer",
  description: `Role(s) allowed: 
  - Customer (8)
  - Sales agent (16)
  \n Sales agent can also place the order on behalf of the customer.
  
  \n Payment types for order:
   - COD
   - CREDIT
   - COD_WALLET
   - SADAD
   - SADAD_WALLET
  
  \n May communicate with:
   - **User service** to fetch customer/shop related details
   - **Config service** to fetch location details
   - **Coupon service** to validate and create coupon usage history if coupon is applied on the order
   - **LMS service** for CREDIT orders for loan related applications
   - **Wallet service** for CREDIT orders
   - **@development-team20/notification-library** to send order placement notification to the customer,
   - **AWS.SNS** to publish order info`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.postOrderValidation).swagger),
};

const updateOrderStatusFromLogisticsSchema = {
  summary: "Updates order's end state from Logistics app",
  description: `Role(s) allowed: 
  - Delivery Agent (6)

  \n Order can be moved to one of the following states using this API if the batch has been accepted:
  - PARTIAL_DELIVERED
  - DELIVERED
  - CANCELLED
  - ON_HOLD

  \n May communicate with:  
  - **Coupon service** to fetch coupon details if it was applied on the order
  - **Config service** to fetch location details
  - **Payments service** for payment related transactions (rollback/cancel/complete etc)
  - **LMS service** (CREDIT orders) - for loan related applications (fetch/create/deliverOrderOncredit etc)
  - **Elastic Search** Product update in Elastic Search in case of any error
  - **@development-team20/notification-library** to send order placement notification to the customer
  - **AWS.SNS** to publish order info`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.putOrderStatusValidation).swagger),
};

const updateOrderStatusFromPortalSchema = {
  summary: "Updates order's end state from Admin Portal (Hubble)",
  description: `Role(s) allowed: 
  - Company Owner (9)
  - Super Admin (1)

  \n Order can be moved to one of the following states using this API:
  - RESERVED state can be changed to PACKED, CANCELLED, ON_HOLD
  - PACKED state can be changed to CANCELLED, ON_HOLD
  - ON_HOLD state can be changed to PACKED

  \n May communicate with:
  - **Coupon service** to fetch coupon details if it was applied on the order
  - **Config service** to fetch location details
  - **Payments service** for payment related transactions (rollback/cancel/complete etc)
  - **LMS service** (CREDIT orders) - for loan related applications (fetch/create/deliverOrderOncredit etc)
  - **Elastic Search** Product update in Elastic Search in case of any error
  - **@development-team20/notification-library** to send order placement notification to the customer
  - **AWS.SNS** to publish order info`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.putOrderStatusValidation).swagger),
};

const updateOrderStatusFromConsumerSchema = {
  summary: "Allows customer to cancel their order from consumer app",
  description: `Role(s) allowed: 
  - Customer (8)
  - Sales agent (16)

  \n May communicate with:  
  - **Coupon service** to fetch coupon details if it was applied on the order
  - **Config service** to fetch location details
  - **Payments service** for payment related transactions (rollback/cancel/complete etc)
  - **LMS service** (CREDIT orders) - for loan related applications (fetch/create/deliverOrderOncredit etc)
  - **Elastic Search** Product update in Elastic Search in case of any error
  - **@development-team20/notification-library** to send order placement notification to the customer
  - **AWS.SNS** to publish order info`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.putOrderStatusValidation).swagger),
};

const putOrderStatusesValidationSchema = {
  summary: "Returns order statuses [order_id, status, placed_at]",
  description: `Role(s) allowed: 
  - Customer (8)
  - Sales agent (16)
  
  \n Sales agent will be able to view orders placed in last 30 days only`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.putOrderStatusesValidation).swagger),
};

const getOrderByIdSchema = {
  summary: "Returns complete order details including order items and order history",
  description: `Role(s) allowed: 
  - Customer (8)
  - Sales agent (16)`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.putOrderValidation).swagger),
};

const putOrderPaymentTypeValidationSchema = {
  summary: "Updates order's current payment type with the requested one",
  description: `Role(s) allowed: 
  - Customer (8)
  
  \n May communicate with:  
  - **Config service** to fetch location details
  - **Payments service** to validate credit order if new payment type is CREDIT
  - **LMS service** (CREDIT orders) - for loan related applications (fetch/create/deliverOrderOncredit etc)
  - **@development-team20/notification-library** to send update notification to the customer
  `,
  ...getSwaggerSchema(joiToSwagger(validationSchema.putOrderPaymentTypeValidation).swagger),
};

const getOrderPaymentTypeSchema = {
  summary: "Returns order's payment type",
  description: `Role(s) allowed: 
  - Delivery Agent (6)
  
  \n Returns order's current payment type`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.getOrderPaymentType).swagger),
};

const getLatestOrderByCustomerIdSchema = {
  summary: "Returns latest order details by customer Id",
  description: `- s2s token required`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.getLatestOrderByCustomerId).swagger),
};

const getGrowthOrderMetricsSchema =
{
  summary: "Returns customer growth metrics for the provided datetime range",
  description: `Role(s) allowed: 
  - Sales Agent (16)`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.getGrowthOrderMetrics).swagger),
};

const getDGMVbyCustomerIdValidationSchema =
{
  summary: "Returns categories delivered GMV against the provided criteria",
  description: `Role(s) allowed: 
  - Sales Agent (16)`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.getCategoriesDgmvByCustomerId).swagger),
};

const spotSaleOrderValidationSchema = {
  summary: "Places new order(s) for customer",
  description: `Role(s) allowed: 
  - Delivery agent (6)
  \n Delivery agent place the spot sale order.
  
  \n Payment types for order:
   - COD`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.spotOrderValidation).swagger),
};

const fetchOrderItemsValidationSchema = {
  summary: "Fetch products in an order",
  description: `Role(s) allowed: 
  - Warehouse Executive`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.fetchOrderItemsValidation).swagger),
};

module.exports = {
  postOrderValidationSchema,
  updateOrderStatusFromLogisticsSchema,
  updateOrderStatusFromPortalSchema,
  updateOrderStatusFromConsumerSchema,
  putOrderStatusesValidationSchema,
  getOrderByIdSchema,
  putOrderPaymentTypeValidationSchema,
  getOrderPaymentTypeSchema,
  getLatestOrderByCustomerIdSchema,
  getGrowthOrderMetricsSchema,
  getDGMVbyCustomerIdValidationSchema,
  spotSaleOrderValidationSchema,
  fetchOrderItemsValidationSchema,
};

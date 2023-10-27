/* eslint-disable max-len */
const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./OrderFeedbackJoiValidation");
const { getSwaggerSchema } = require("../../../../swagger/utils");
const ORDER_FEEDBACK = "Order Feedback";

const createOrderFeedbackValidationSchema = {
  tags: [ORDER_FEEDBACK],
  summary: "Creates customer feedback against the order [Consumer]",
  description: `**Role(s) allowed**: 
  - Customer (8)
  - Sales agent (16)
  
  \n **Order states eligible for recording feedback:**
   - PARTIAL_DELIVERED
   - DELIVERED
   - CANCELLED
  `,
  ...getSwaggerSchema(joiToSwagger(validationSchema.createOrderFeedbackValidation).swagger),
};

const getOrderFeedbackValidationSchema = {
  tags: [ORDER_FEEDBACK],
  summary: "Returns customer feedback against the provided order Id [Consumer]",
  description: `**Role(s) allowed**:
  - Customer (8)
  - Sales agent (16)
  `,
  ...getSwaggerSchema(joiToSwagger(validationSchema.getOrderFeedbackValidation).swagger),
};

const getCustomerFeedbackValidationSchema = {
  tags: [ORDER_FEEDBACK],
  summary: "Returns the list of feedbacks provided by the customer [Consumer]",
  description: `**Role(s) allowed**: 
  - Customer (8)
  - Sales agent (16)
  `,
  ...getSwaggerSchema(joiToSwagger(validationSchema.getCustomerFeedbackValidation).swagger),
};

const getFeedbackMissingOrderValidationSchema = {
  tags: [ORDER_FEEDBACK],
  summary: "Returns details of the last order against which feedback has not been recorded yet [Consumer]",
  description: `**Role(s) allowed**: 
  - Customer (8)
  - Sales agent (16)
 
  This API returns the details of the last order that was delivered, partial delivered or cancelled in the past 3 days and is still missing customer's feedback.`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.getFeedbackMissingOrderValidation).swagger),
};

module.exports = {
  createOrderFeedbackValidationSchema,
  getOrderFeedbackValidationSchema,
  getCustomerFeedbackValidationSchema,
  getFeedbackMissingOrderValidationSchema,
};

const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./BatchJoiValidation");
const { getSwaggerSchema } = require("../../../../swagger/utils");

const putBatchValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.putBatchValidation).swagger);
// eslint-disable-next-line max-len
const getOrdersByBatchValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.getOrdersByBatchValidation).swagger);

// eslint-disable-next-line max-len
const getSpotProductsValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.getSpotProductsValidation).swagger);

const getBatchStatusValidationSchema =
  getSwaggerSchema(joiToSwagger(validationSchema.getBatchStatusValidation).swagger);
// eslint-disable-next-line max-len
const getRtgCompletedValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.getRtgCompletedValidation).swagger);
const getBatchIdValidationSchema =
  getSwaggerSchema(joiToSwagger(validationSchema.getBatchIdValidation).swagger);

// eslint-disable-next-line max-len
const putBatchRtgStatusValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.putBatchRtgStatusValidation).swagger);

// eslint-disable-next-line max-len
const batchRtgUnassignValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.batchRtgUnassignValidation).swagger);

// eslint-disable-next-line max-len
const batchRtgAssignValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.batchRtgAssignValidation).swagger);

const getSearchProductsInBatchValidationSchema =
  getSwaggerSchema(joiToSwagger(validationSchema.getsearchProductsInBatchValidation).swagger);

// eslint-disable-next-line max-len
const saveCashClosingValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.saveCashClosingValidation).swagger);

// eslint-disable-next-line max-len
const attachSaveInBatchValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.attachSaveInBatchValidation).swagger);

// eslint-disable-next-line max-len
const getCashClosingValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.getCashClosingValidation).swagger);

module.exports = {
  putBatchValidationSchema,
  getOrdersByBatchValidationSchema,
  getSpotProductsValidationSchema,
  getBatchStatusValidationSchema,
  getRtgCompletedValidationSchema,
  getBatchIdValidationSchema,
  putBatchRtgStatusValidationSchema,
  saveCashClosingValidationSchema,
  getCashClosingValidationSchema,
  getSearchProductsInBatchValidationSchema,
  attachSaveInBatchValidationSchema,
  batchRtgUnassignValidationSchema,
  batchRtgAssignValidationSchema,
};

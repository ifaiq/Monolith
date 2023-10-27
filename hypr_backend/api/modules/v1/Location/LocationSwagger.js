const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./LocationJoiValidation");
const { getSwaggerSchema } = require("../../../../swagger/utils");

const getLocationValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.getLocationValidation).swagger);
const getBannersValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.getBannersValidation).swagger);
const putBannersValidationSchema =
    getSwaggerSchema(joiToSwagger(validationSchema.putBannersValidation).swagger);
const removeBannersValidationSchema = getSwaggerSchema(joiToSwagger(validationSchema.removeBannersValidation).swagger);
const getLocationsByBusinessUnitValidationSchema =
    getSwaggerSchema(joiToSwagger(validationSchema.getLocationsByBusinessUnitValidation).swagger);


module.exports = {
  getLocationValidationSchema,
  getBannersValidationSchema,
  putBannersValidationSchema,
  removeBannersValidationSchema,
  getLocationsByBusinessUnitValidationSchema,
};

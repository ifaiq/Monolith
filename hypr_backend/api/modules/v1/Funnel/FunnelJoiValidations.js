const { Joi } = require("../../../../utils/services");

/**
 * Defines Schema to perform JOI validations
 * - GET /api/v1/category/getCategoriesForExternalUse
 */
const getCategoriesExternalResourceValidation = Joi.object()
  .keys({
    query: Joi.object({
      id: Joi.string(),
      type: Joi.number().integer().positive().strict(),
      parent_id: Joi.string(),
      disabled_at: Joi.string(),
      location_id: Joi.number().integer().positive().strict(),
    }).or("id", "type").unknown(true),
  });

/**
 * Defines Schema to perform JOI validations
 * - GET /api/v1/category
 */
const getCategoriesValidation = Joi.object()
  .keys({
    query: Joi.object({
      locationId: Joi.number().integer().positive().strict(),
      categoryId: Joi.number().integer().positive().strict(),
      page: Joi.number().integer().positive().strict().required(),
      perPage: Joi.number().integer().positive().strict().required(),
    }).xor("locationId", "categoryId").unknown(true),
  });

/**
 * Defines Schema to perform JOI validations
 * - GET /api/v1/brand
 */
const getBrandsValidation = Joi.object()
  .keys({
    query: Joi.object({
      locationId: Joi.number().integer().positive().strict(),
      brandId: Joi.number().integer().positive().strict(),
      page: Joi.number().integer().positive().strict().required(),
      perPage: Joi.number().integer().positive().strict().required(),
    }).xor("locationId", "brandId").unknown(true),
  });

/**
 * Defines Schema to perform JOI validations
 * - GET /api/v1/category
 */
const updateLanguages = Joi.object()
  .keys({
    body: Joi.object({
      fileName: Joi.string().required(),
      locationId: Joi.number().integer().positive().required(),
    }).unknown(true),
    locals: Joi.object({
      userData: Joi.object({
        email: Joi.string().required(),
      }),
    }).unknown(true),
  });

module.exports = {
  getCategoriesValidation,
  getBrandsValidation,
  updateLanguages,
  getCategoriesExternalResourceValidation,
};

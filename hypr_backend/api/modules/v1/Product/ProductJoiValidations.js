const { Joi } = require("../../../../utils/services");

/**
 * Defines Schema to perform JOI validations
 * - GET /api/v1/product
 */
const getProductsValidation = Joi.object()
  .keys({
    query: Joi.object({
      categoryId: Joi.number().integer().positive(),
      zones: Joi.string().optional().allow(""),
      shopTypeId: Joi.number().integer().positive().optional().allow("").allow(null),
      locationId: Joi.number().integer().positive().optional(),
      brandId: Joi.number().integer().positive(),
      page: Joi.number().integer().positive().required(),
      perPage: Joi.number().integer().positive().required(),
    }).xor("categoryId", "brandId").unknown(true),
  });

/**
 * Defines Schema to perform JOI validations
 * - GET /api/v1/product/getProductsFromSkus
 */
const getProductsFromSkusValidation = Joi.object()
  .keys({
    query: Joi.object({
      sku: Joi.array().single().required(),
      getLocationName: Joi.boolean(),
    }),
  });

/**
 * Defines Schema to perform JOI validations
 * - GET /api/v1/product/searchFromEs
 */
const searchFromEsValidation = Joi.object()
  .keys({
    query: Joi.object({
      search: Joi.string().required(),
      locationId: Joi.number().integer().positive().required(),
      zones: Joi.string().optional().allow(""),
      shopTypeId: Joi.number().integer().positive().optional().allow("").allow(null),
      page: Joi.number().integer().positive().required(),
      perPage: Joi.number().integer().positive().required(),
    }).unknown(true),
  });

/**
 * Defines Schema to perform JOI validations
 * - GET /api/v1/product/updateProductLanguages
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

const likeProductValidation = Joi.object()
  .keys({
    body: Joi.object({
      productId: Joi.number().integer().positive().required(),
      customerId: Joi.number().integer().positive().required(),
      isLiked: Joi.boolean().required(),
      isToolTip: Joi.boolean(),
    }),
  });

const getLikeProductsValidation = Joi.object()
  .keys({
    query: Joi.object({
      customerId: Joi.number().integer().positive().required(),
      locationId: Joi.number().integer().positive().optional().allow(""),
      zones: Joi.string().optional().allow(""),
      shopTypeId: Joi.number().integer().positive().optional().allow("").allow(null),
      page: Joi.number().integer().positive().required(),
      perPage: Joi.number().integer().positive().required(),
    }).unknown(true),
  });
const recommendedProductsValidation = Joi.object()
  .keys({
    query: Joi.object({
      customerId: Joi.number().integer().positive().required(),
      zones: Joi.string().optional().allow(""),
      shopTypeId: Joi.number().integer().positive().optional().allow("").allow(null),
      page: Joi.number().integer().positive().required(),
      perPage: Joi.number().integer().positive().required(),
      locationId: Joi.number().integer().positive().required(),
    }).unknown(true),
  });
const upsertRecommendedProductValidation = Joi.object()
  .keys({
    body: Joi.object({
      customerId: Joi.number().integer().positive().required(),
      productIds: Joi.array().items(Joi.number()).required(),
    }).unknown(true),
  });
const upsertGenericProductValidation = Joi.object()
  .keys({
    body: Joi.object({
      locationId: Joi.number().integer().positive().required(),
      productIds: Joi.array().items(Joi.number()).required(),
    }).unknown(true),
  });

const getProductIdValidation = Joi.object()
  .keys({
    params: {
      id: Joi.string().pattern(/^[0-9]+$/).required(),
    },
  });

const getProductExternalResourceValidation = Joi.object()
  .keys({
    query: Joi.object({
      sku: Joi.string(),
      locationId: Joi.number().integer().positive(),
    }),
  });

const getProductsForPortalValidation = Joi.object()
  .keys({
    body: Joi.object({
      sku: Joi.string(),
      id: Joi.string(),
      locationId: Joi.number().integer().positive().required(),
      select: Joi.string(),
    }),
  });

module.exports = {
  getProductsValidation,
  getProductsFromSkusValidation,
  searchFromEsValidation,
  updateLanguages,
  likeProductValidation,
  getLikeProductsValidation,
  recommendedProductsValidation,
  upsertRecommendedProductValidation,
  upsertGenericProductValidation,
  getProductIdValidation,
  getProductExternalResourceValidation,
  getProductsForPortalValidation,
};

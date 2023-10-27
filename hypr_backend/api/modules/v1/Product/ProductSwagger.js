const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./ProductJoiValidations");
const { getSwaggerSchema } = require("../../../../swagger/utils");

const getProductsValidationSchema = {
  summary: "Get products on the basis of location id or category [CONSUMER]",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Consumer(8)</li>
    <li>Sales Agent(16)</li>
  </ol>
  <h4>Communicates with:</h4>
  <ul>
    <li><b>Redis</b> To fetch or update products in redis cache</li>
    <li><b>User Service</b>To get customer details</li>
  </ul>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.getProductsValidation).swagger,
  ),
};
const getProductsFromSkusValidation = {
  summary: "Get products by SKUs",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Consumer(8)</li>
    <li>Company Owner(9)</li>
  </ol>
  <h4>Communicates with:</h4>
    <ul>
      <li><b>Config Service</b> To get location name</li>
    </ul>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.getProductsFromSkusValidation).swagger,
  ),
};
const searchFromEsValidationSchema = {
  summary: "Search products [CONSUMER]",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Consumer(8)</li>
    <li>Sales Agent(16)</li>
  </ol>
  <h4>Communicates with:</h4>
    <ul>
      <li><b>Elastic Search</b> To get products from Elastic Search</li>
  </ul>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.searchFromEsValidation).swagger,
  ),
};
const updateLanguagesSchema = {
  summary: "Bulk update product languages with file [ADMIN PORTAL]",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Company Owner(9)</li>
  </ol>
  <h4>Communicates with:</h4>
    <ul>
      <li><b>Elastic Search</b> To update products in Elastic Search</li>
  </ul>`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.updateLanguages).swagger),
};
const likeProductValidationSchema = {
  summary: "Like product [CONSUMER]",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Consumer(8)</li>
    <li>Sales Agent(16)</li>
  </ol>
  <h4>Communicates with:</h4>
    <ul>
      <li><b>User Service</b> To Update retailer data (<i>isToopTip</i> flag update)</li>
  </ul>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.likeProductValidation).swagger,
  ),
};
const getLikeProductsValidationSchema = {
  summary: "Get Liked product(s) [CONSUMER]",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Consumer(8)</li>
    <li>Sales Agent(16)</li>
  </ol>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.getLikeProductsValidation).swagger,
  ),
};
const recommendedProductsValidationSchema = {
  summary: "Get recommended products [CONSUMER]",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Consumer(8)</li>
    <li>Sales Agent(16)</li>
  </ol>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.recommendedProductsValidation).swagger,
  ),
};
const upsertRecommendedProductValidationSchema = {
  summary: "Create or update recommanded product",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
  </ol>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.upsertRecommendedProductValidation).swagger,
  ),
};
const upsertGenericProductValidationSchema = {
  summary: "Create or update generic product",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
  </ol>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.upsertGenericProductValidation).swagger,
  ),
};
const getProductIdValidationSchema = {
  summary: "Get product by ID [S2S]",
  description: `Auth:</h4>
  <ol>
    <li>s2s Token</li>
  </ol>
  <h4>Communicates with:</h4>
    <ul>
      <li><b>Redis</b> To get product data from redis cache</li>
    </ul>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.getProductIdValidation).swagger,
  ),
};
const getProductExternalResourceValidationSchema = {
  summary: "Get products [S2S]",
  description: `Auth:</h4>
  <ol>
    <li>s2s Token</li>
  </ol>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.getProductExternalResourceValidation).swagger,
  ),
};
const getProductsForPortalValidationSchema = {
  summary: "Get products for portal [ADMIN PORTAL]",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Company Owner(9)</li>
  </ol>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.getProductsForPortalValidation).swagger,
  ),
};

module.exports = {
  getProductsValidationSchema,
  getProductsFromSkusValidation,
  searchFromEsValidationSchema,
  updateLanguagesSchema,
  likeProductValidationSchema,
  getLikeProductsValidationSchema,
  recommendedProductsValidationSchema,
  upsertRecommendedProductValidationSchema,
  upsertGenericProductValidationSchema,
  getProductIdValidationSchema,
  getProductExternalResourceValidationSchema,
  getProductsForPortalValidationSchema,
};

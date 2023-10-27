const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./FunnelJoiValidations");
const { getSwaggerSchema } = require("../../../../swagger/utils");

const getCategoriesValidationSchema = {
  summary: "Get categories [CONSUMER]",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Consumer(8)</li>
    <li>Company Owner(9)</li>
    <li>Sales Agent(16)</li>
  </ol>
  <h4>Communicates with:</h4>
  <ul>
      <li><b>User service</b> To Update retailer data</li>
      <li><b>Redis</b> To cache categories data with redis</li>
  </ul>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.getCategoriesValidation).swagger,
  ),
};

const getCategoriesExternalResourceValidationSchema = {
  summary: "Get categories [External]",
  description: `<h3>Use one of the param (ids or type) ids prioritize</h3>
  <h3>other params can be used with type param</h3>

  <h4>Role(s) Allowed:</h4>
  <ol>
    <li>Company Owner(9)</li>
    <li>Sales Agent(16)</li>
  </ol>
  <h4>Communicates with:</h4>
  <ul>
      <li><b>Growth-backend</b> Fetch data based on requirement</li>
      <li><b>Growth-portal</b> To get categories/brands data for dropdown</li>
  </ul>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.getCategoriesExternalResourceValidation).swagger,
  ),
};
const updateLanguagesSchema = {
  summary: "Bulk update category languages [PORTAL]",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Company Owner(9)</li>
  </ol>`,
  ...getSwaggerSchema(joiToSwagger(validationSchema.updateLanguages).swagger),
};

module.exports = {
  getCategoriesValidationSchema,
  updateLanguagesSchema,
  getCategoriesExternalResourceValidationSchema,
};

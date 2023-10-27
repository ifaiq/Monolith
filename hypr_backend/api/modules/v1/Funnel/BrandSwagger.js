const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./FunnelJoiValidations");
const { getSwaggerSchema } = require("../../../../swagger/utils");

const getBrandValidationSchema = {
  summary: "Get Brands",
  description: `<h4>Role(s) Allowed:</h4>
  <ol>
    <li>Sales Agent(16)</li>
  </ol>
  <h4>Communicates with:</h4>
  <ul>
      <li><b>Redis</b> To get brand(s) data from redis cache</li>
  </ul>`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.getBrandsValidation).swagger,
  ),
};

module.exports = {
  getBrandValidationSchema,
};

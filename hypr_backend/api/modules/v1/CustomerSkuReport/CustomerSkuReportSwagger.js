const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./CustomerSkuReportJoiValidation.js");
const { getSwaggerSchema } = require("../../../../swagger/utils");


const createReportUserSkuValidationSchema = {
  summary: "Map customer & sku for reporting",
  description: `**Role(s) allowed:** 
  - Company Owner (9)
  - Super Admin (1)
  \n This endpoint should be used along with the uploadFileToS3 API.
  
  \n Reponsible for mapping the user & sku for getting GMV and DGMV of a specific
  user against a specific SKU
  
  \n May communicate with:
   - **User service** to fetch customer details
   - **Monolith DB**  to get the productIds
   - **AWS.S3** to read the content of the file that was uploaded by uploadFileToS3 API`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.createReportUserSkuValidation).swagger,
  ),
};

const getCustomerReportSkusSchema = {
  summary: "Get customer & sku for reporting",
  description: `**Role(s) allowed:** 
  - Company Owner (9)
  - Super Admin (1)
  
  \n Reponsible for retrieveing the previously uploaded files 
  
  \n May communicate with:
   - **User service** to fetch customer details
   - **Monolith DB**  to get the SKUs`,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.getCustomerReportSkuValidation).swagger,
  ),
};
module.exports = {
  createReportUserSkuValidationSchema,
  getCustomerReportSkusSchema,
};

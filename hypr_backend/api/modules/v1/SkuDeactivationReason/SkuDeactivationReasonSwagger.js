const joiToSwagger = require("joi-to-swagger");
const validationSchema = require("./SkuDeactivationReasonJoiValidations");
const { getSwaggerSchema } = require("../../../../swagger/utils");

const getSkuDeactivationReason = {
  summary: "Get the reasons to deactivate or activate the sku",
  description: `**Role(s) allowed:** 
  - Company Owner (9)
  - Super Admin (1)
  
  \n Responsible for getting the reason based on type filter (ENABLED | DISABLED)

  \n Need to pass type (ENABLED | DISABLED) in query params

  \n Example url/endpoint?type=ENABLED
  `,
};

const createSkuDeactivationReason = {
  summary: "Create a reason to deactivate or activate the sku",
  description: `**Role(s) allowed:** 
  - Company Owner (9)
  - Super Admin (1)
  
  \n Responsible for creating the reason
  `,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.createSkuDeactivationReasonValidation).swagger,
  ),
};

const updateSkuDeactivationReason = {
  summary: "Update a reason information to deactivate or activate the sku",
  description: `**Role(s) allowed:** 
  - Company Owner (9)
  - Super Admin (1)
  
  \n Responsible for updating the reason
  `,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.updateSkuDeactivationReasonValidation).swagger,
  ),
};

const deleteSkuDeactivationReason = {
  summary: "Delete a reason information to deactivate or activate the sku",
  description: `**Role(s) allowed:** 
  - Company Owner (9)
  - Super Admin (1)
  
  \n Responsible for deleting the reason
  `,
  ...getSwaggerSchema(
    joiToSwagger(validationSchema.deleteSkuDeactivationReasonValidation).swagger,
  ),
};

module.exports = {
  getSkuDeactivationReason,
  createSkuDeactivationReason,
  updateSkuDeactivationReason,
  deleteSkuDeactivationReason,
};

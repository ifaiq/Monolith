const camelcaseKeys = require("camelcase-keys");
const userRolesExtractionService = require("../../../rbac_service_extraction/userRolesService");
/**
 *
 * @param {Object} criteria
 * @param {Object} attributesSelection
 * @returns {Array} UserRoles
 */

const findAll = async criteria => camelcaseKeys(
  await userRolesExtractionService.find({ ...criteria, select: "userId,roleId", allData: true }),
);

module.exports = {
  findAll,
};

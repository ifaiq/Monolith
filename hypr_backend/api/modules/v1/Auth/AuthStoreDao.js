const camelcaseKeys = require("camelcase-keys");
const { errors: { AUTH_STORE_NOT_FOUND } } = require("./Errors");
const authStoreExtractionService = require("../../../rbac_service_extraction/authStoreService");

/**
 *
 * @param {*} userId
 * @returns
 */
const findByUserIdChecked = async userId => {
  const authStore = await authStoreExtractionService.find({ user: userId });
  if (_.isEmpty(authStore)) {
    throw AUTH_STORE_NOT_FOUND();
  }
  return camelcaseKeys(authStore);
};

/**
 *
 * @param {Object} criteria
 * @param {Object} attributesSelection
 * @returns {Array} AuthStore
 */

const findAll = async criteria => await authStoreExtractionService.find({
  ...criteria,
  select: "user,location",
  allData: true,
});

module.exports = {
  findByUserIdChecked,
  findAll,
};

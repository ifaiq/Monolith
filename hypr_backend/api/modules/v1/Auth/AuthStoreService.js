const authStoreDao = require("./AuthStoreDao");

/**
 * This function takes the user and return auth store.
 *
 * @param {Number} userId
 * @returns {Object} auth store
 */
const findAuthStoresByUserIdChecked = async userId => await authStoreDao.findByUserIdChecked(userId);

module.exports = {
  findAuthStoresByUserIdChecked,
};

const companyDao = require("./CompanyDao");

/**
 * This function takes the id and returns company.
 *
 * @param {Number} id
 * @returns {Object} company
 */
const findCompany = async id => await companyDao.findCompanyById(id);

module.exports = {
  findCompany,
};

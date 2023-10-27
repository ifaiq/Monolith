/**
 * This file is responsible for communication between service
 * and database companies table.
 */
const companyExtractionService = require("../../../config_service_extraction/companiesExtraction");

const camelcaseKeys = require("camelcase-keys");
const { errors: { COMPANY_NOT_FOUND } } = require("./Errors");

/**
 * This method is responsible to get company by code.
 * if company not found, it will throw COMPANY_NOT_FOUND exception
 * @param code of the company
 * @returns {Promise<*>} company
 */
const findCompanyByCodeChecked = async code => {
  const company = (await companyExtractionService.find({ code }))[0];
  if (!company) {
    throw COMPANY_NOT_FOUND();
  }
  return company;
};

/**
 * This function takes company id and returns company
 *
 * @param {Number} id
 * @returns {Array} company
 */
const findCompanyById = async id => camelcaseKeys(await companyExtractionService.findOne({ id }));

module.exports = {
  findCompanyByCodeChecked,
  findCompanyById,
};

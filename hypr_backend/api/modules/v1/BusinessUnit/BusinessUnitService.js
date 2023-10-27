const camelcaseKeys = require("camelcase-keys");
const businessUnitDao = require("./BusinessUnitDao");

/**
 * This function takes the id and returns business unit.
 *
 * @param {Number} id
 * @returns {Object} business unit
 */
const getBusinessUnitById = async id => camelcaseKeys(await businessUnitDao.findById(id));

/**
 * This function takes a critera and returns a business_unit.
 *
 * @param {object} criteria
 * @returns {Object} business_unit
 */
const getBusinessUnits = async criteria => await businessUnitDao.findByCriteria(criteria);

/**
 * This function takes a critera and returns a business_unit.
 *
 * @param {object} criteria
 * @returns {Object} business_unit
 */
const findOne = async criteria => await businessUnitDao.findOne(criteria);

module.exports = {
  getBusinessUnitById,
  getBusinessUnits,
  findOne,
};

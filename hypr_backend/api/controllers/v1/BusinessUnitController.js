const {
  businessUnitService,
} = require("../../modules/v1/BusinessUnit");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../constants/http");


/**
 * getBusinessUnitById function to get a business unit.
 * Using function to get business unit using id.
 *
 * @param {Object} req
 * @param {Object} res
 */
const getBusinessUnitById = async (req, res) => {
  const { params: { id } } = req;
  const logIdentifier = `API version: ${v1}, context: BusinessUnitController.getBusinessUnitById(),`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const businessUnit = await businessUnitService.getBusinessUnitById(id);
    res.ok(businessUnit);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

/**
 * getBusinessUnits by criteria
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const getBusinessUnits = async (req, res) => {
  const { query: { id, countryCode } } = req;
  const logIdentifier = `API version: ${v1}, context: BusinessUnitController.getBusinessUnits(),`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const queryParams = { id, countryCode };
    for (const key in queryParams) {
      if (!queryParams[key]) {
        delete queryParams[key];
      }
    }
    const businessUnit = await businessUnitService.getBusinessUnits({ id, countryCode });
    res.ok(businessUnit);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};
/**
 * getBusinessUnitByIdForPortal function to get a business unit.
 * Using function to get business unit using id.
 *
 * @param {Object} req
 * @param {Object} res
 */
const getBusinessUnitByIdForPortal = async (req, res) => {
  const { params: { id } } = req;
  const logIdentifier = `API version: ${v1}, context: BusinessUnitController.getBusinessUnitByIdForPortal(),`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const businessUnit = await businessUnitService.getBusinessUnitById(id);
    res.ok(businessUnit);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

module.exports = {
  getBusinessUnitById,
  getBusinessUnits,
  getBusinessUnitByIdForPortal,
};

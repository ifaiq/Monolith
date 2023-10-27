const {
  locationService: {
    getLocationByIdWithDTO,
    findLocationBanners,
    createOrUpdateLocationBanners,
    deleteLocationBanners: deleteBanners,
    getStoreFeaturesForLocation,
    getLocations,
  },
} = require("../../modules/v1/Location");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../constants/http");

const getLocationById = async (req, res) => {
  const { params: { id } } = req;
  const logIdentifier = `API version: ${v1}, 
  context: LocationController.getLocationById()`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const location = await getLocationByIdWithDTO(id);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(location)}`);
    res.ok(location);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

const getBanners = async (req, res) => {
  const { params: { id }, user: { role }, userId } = req;
  const logIdentifier = `API version: ${v1}, 
  context: LocationController.getBanners(),
  UserId: ${userId}, 
  Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    const banners = await findLocationBanners(id, role);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(banners)}`);
    res.ok(banners);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const createOrUpdateBanners = async (req, res) => {
  const { user: { id, role } } = req;
  const logIdentifier = `API version: ${v1}, 
  context: LocationController.createOrUpdateBanners(),
  UserId: ${id}, 
  Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const { banners } = req.allParams();
    const updatedBanners = await createOrUpdateLocationBanners(banners);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(updatedBanners)}`);
    res.ok(updatedBanners);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const deleteLocationBanners = async (req, res) => {
  const { user: { id, role } } = req;
  const logIdentifier = `API version: ${v1}, 
  context: LocationController.deleteLocationBanners(),
  UserId: ${id}, 
  Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const { banners } = req.allParams();
    const deletedBanners = await deleteBanners(banners);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(deletedBanners)}`);
    res.ok(deletedBanners);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

/**
 * Responsible to get store features against provided location
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @private
 */
const getStoreFeatures = async (req, res) => {
  const { query: { businessUnitId } } = req;

  const logIdentifier = `API version: V1,
    context: LocationController.getStoreFeatures(),
    business unit: ${businessUnitId}`;
  try {
    sails.log.info(`${logIdentifier} store features`);
    const result = await getStoreFeaturesForLocation(businessUnitId);
    res.ok(result);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};
const getLocationByIdForPortal = async (req, res) => {
  const { params: { id } } = req;
  const logIdentifier = `API version: ${v1}, 
  context: LocationController.getLocationByIdForPortal()`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const location = await getLocationByIdWithDTO(id);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(location)}`);
    res.ok(location);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

/**
 * Responsible to fetch against a particular business unit id
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const getLocationsByCriteria = async (req, res) => {
  const { query: { businessUnitId } } = req;
  const logIdentifier = `API version: ${v1}, 
  context: LocationController.getLocationsByBusinessUnitId()`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const locations = await getLocations({ businessUnitId });
    res.ok(locations);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

module.exports = {
  getLocationById,
  getBanners,
  createOrUpdateBanners,
  deleteLocationBanners,
  getStoreFeatures,
  getLocationsByCriteria,
  getLocationByIdForPortal,
};

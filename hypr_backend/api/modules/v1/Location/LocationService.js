const camelcaseKeys = require("camelcase-keys");
const locationDao = require("./LocationDao");
const locationBannersDao = require("./LocationBannersDao");
const { HyprRoles: { CONSUMER } } = require("../../../services/Constants");

const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");

const { findHierarchyFeaturesByBusinessUnitId } = require("../HierarchyFeatures");

/**
 * This function takes the id and return location.
 *
 * @param {Number} id
 * @returns {Object} location
 */
const findLocation = async id => await locationDao.find(id);

/**
 * This function takes the id and return banners.
 *
 * @param {Number} id
 * @param {Number} role
 * @returns {Array} banners
 */
const findLocationBanners = async (id, role) => {
  const criteria = { locationId: id };
  if (role === CONSUMER) {
    criteria.disabled = false;
  }
  return await locationBannersDao.findLocationBanners(criteria);
};

/**
 * This function takes the location banners and return created or updated location banners.
 *
 * @param {Banners[]} location banners
 * @returns {Banners[]} location banners
 */
const createOrUpdateLocationBanners = async banners => {
  const logIdentifier = `API version: ${v1},
  Context: LocationService.createOrUpdateLocationBanners(),`;
  sails.log(`${logIdentifier} called with the params ->
    banners: ${banners}`);
  const updateBannersPromises = [];
  banners.map(banner =>
    banner.id
      ? updateBannersPromises.push(locationBannersDao.update(banner.id, banner))
      : updateBannersPromises.push(locationBannersDao.create(banner)),
  );
  return await Promise.all(updateBannersPromises);
};

/**
 * This function takes the banner ids and destroy banners.
 *
 * @param {Number} id
 * @returns {Array[]} banners
 */
const deleteLocationBanners = async bannerIds => await locationBannersDao.destroy(bannerIds);

/**
 * This method is responsible for getting features against a store
 * @param lat latitude
 * @param lng latitude
 * @returns features for store
 */
const getStoreFeaturesForLocation = async businessUnitId => {
  const features = await findHierarchyFeaturesByBusinessUnitId(businessUnitId);
  return camelcaseKeys({
    features,
  }, { deep: true });
};

/**
 * This function takes the id and returns location with DTO.
 *
 * @param {Number} id
 * @returns {Object} location
 */
const getLocationByIdWithDTO = async id => camelcaseKeys(await locationDao.find(id));

/**
 * This function takes a critera and returns a business_unit.
 *
 * @param {object} criteria
 * @returns {Object} locations
 */
const getLocations = async criteria => await locationDao.findByCriteria(criteria);

module.exports = {
  getLocationByIdWithDTO,
  findLocation,
  findLocationBanners,
  createOrUpdateLocationBanners,
  deleteLocationBanners,
  getStoreFeaturesForLocation,
  getLocations,
};

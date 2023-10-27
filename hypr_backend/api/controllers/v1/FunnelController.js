const {
  funnelService: {
    getEnabledParentCategoriesByLocationId,
    getEnabledParentBrandsByLocationId,
    getEnabledSubcategoriesByCategoryId,
    getEnabledSubbrandsByParentBrandId,
    getBrandsOrCategoriesByParams,
    bulkUpdateLanguages,
  },
} = require("../../modules/v1/Funnel");
// const UserService = require("../../modules/v1/Auth/UserService");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../constants/http");
const customerExtractionService = require("../../user_service_extraction/customerService");

/**
 * Categories controller, with two flows based on inputs
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Object} array of categories and total categories
 */
const getCategories = async (req, res) => {
  const {
    query: { locationId, categoryId, page, perPage },
    user: { id, role },
    headers: { language },
  } = req;
  const logIdentifier = `API version: ${v1}, context: FunnelController.getCategories(), UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    let categories = [];
    if (locationId) {
      categories = await getEnabledParentCategoriesByLocationId(locationId, page, perPage);
    } else if (categoryId) {
      categories = await getEnabledSubcategoriesByCategoryId(categoryId, page, perPage);
    }
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(categories)}`);
    res.ok(categories);
    /*
        1) This is an overhead, added on frontend request. This will be removed on
        front-end confirmation. Before removal, please confirm with the front-end team.
        2) "-Us" is added on header locales to make the user locales. So this is already
        included in tech debt to sync  up the headers locals with the user data
        */
    if (language) {
      try {
        // const result = await UserService.updateProfile(id, { language: `${language.toLowerCase()}-Us` });
        const result = await customerExtractionService.update({ id: id }, { language: `${language.toLowerCase()}-Us` });
        sails.log(`${logIdentifier} user locales updated with -> ${JSON.stringify(result)}`);
      } catch (error) {
        sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
      }
    }
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

/**
 * Categories controller, with two flows based on inputs
 * 1 -> given ids -> fetch ids and return data.
 * 2 -> given other params (level, onlyEnabled, type, locationId)
 *       based on that it will query the db and fetch relevant data.
 * @param {Object} req
 * @param {Object} res
 * @returns {Object[]} array of categories or brands based on req.query
 */
const getCategoriesForExternalUse = async (req, res) => {
  const {
    query: { id: category_id, disabled_at, parent_id, type, location_id },
    user: { id, role },
  } = req;
  const logIdentifier = `API version: ${v1}, 
              context: FunnelController.getCategoriesForExternalUse(), UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);

    const data = await getBrandsOrCategoriesByParams(category_id, type, disabled_at, parent_id, location_id);
    res.ok(data);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

/**
 * Brands controller, with two flows based on inputs
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Object} array of brands and total brands
 */
const getBrands = async (req, res) => {
  const { query: { locationId, brandId, page, perPage }, user: { id, role } } = req;
  const logIdentifier = `API version: ${v1}, context: FunnelController.getBrands(), UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    let brands = [];
    if (locationId) {
      sails.log(`${logIdentifier} by locationId flow`);
      brands = await getEnabledParentBrandsByLocationId(locationId, page, perPage);
    } else if (brandId) {
      sails.log(`${logIdentifier} by brandId flow`);
      brands = await getEnabledSubbrandsByParentBrandId(brandId, page, perPage);
    }
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(brands)}`);
    res.ok(brands);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

/**
 * Update funnel languages
 *
 * @param {Object} req
 * @param {Object} res
 */
const updateLanguages = async (req, res) => {
  const logIdentifier = `API version: ${v1}, context: FunnelController.updateLanguages(),`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.body)}`);

    const { body: { fileName, locationId } } = req;
    const { locals: { userData } } = res;
    res.ok();

    await bulkUpdateLanguages(fileName, locationId, userData);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

module.exports = {
  getCategories,
  getBrands,
  updateLanguages,
  getCategoriesForExternalUse,
};

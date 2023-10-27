const {
  redisService: {
    setMultipleEntities,
    createSortedSet,
    createSortedSetV2,
    getSortedEntitiesByParent,
  },
  constants: {
    FUNNEL_KEY,
    CATEGORY_SUBCATEGORIES_KEY,
    LOCATION_CATEGORIES_KEY,
    BRAND_SUBBRANDS_KEY,
    LOCATION_BRANDS_KEY,
  },
} = require("../Redis");

const getSubcategoriesByCategoryId = async (categoryId, page, perPage) =>
  getSortedEntitiesByParent(
    `${CATEGORY_SUBCATEGORIES_KEY}${categoryId}`,
    `${FUNNEL_KEY}`,
    page,
    perPage,
  );

const getCategoriesByLocationId = async (locationId, page, perPage) =>
  getSortedEntitiesByParent(
    `${LOCATION_CATEGORIES_KEY}${locationId}`,
    `${FUNNEL_KEY}`,
    page,
    perPage,
  );

const getSubbrandsByBrandId = async (brandId, page, perPage) =>
  getSortedEntitiesByParent(
    `${BRAND_SUBBRANDS_KEY}${brandId}`,
    `${FUNNEL_KEY}`,
    page,
    perPage,
  );

const getBrandsByLocationId = async (locationId, page, perPage) =>
  getSortedEntitiesByParent(
    `${LOCATION_BRANDS_KEY}${locationId}`,
    `${FUNNEL_KEY}`,
    page,
    perPage,
  );

/**
 * Alternate of the original function, intended to be used only for categories and brands intially
 * @param {*} key
 * @param {*} funnels
 * @param {*} scoreOn
 * @returns
 */
const setFunnelsSortedsetV2 = async (key, funnels, scoreOn) => createSortedSetV2(key, funnels, scoreOn);

const setFunnelsSortedset = async (key, funnels, scoreOn) => createSortedSet(key, funnels, scoreOn);

const setFunnels = async funnels => setMultipleEntities(FUNNEL_KEY, funnels);

module.exports = {
  getSubcategoriesByCategoryId,
  getCategoriesByLocationId,
  getSubbrandsByBrandId,
  getBrandsByLocationId,
  setFunnelsSortedset,
  setFunnels,
  setFunnelsSortedsetV2,
};

const { getPagination, sortArrayAscendingNullsToEnd } = require("../../../../utils/services");
const {
  findEnabledParentCategoriesByLocationId: findParentCategoriesByLocationIdDB,
  findEnabledCategoriesByParentCategoryId: findCategoriesByParentCategoryIdDB,
  findEnabledParentBrandsByLocationId: findParentBrandsByLocationIdDB,
  findEnabledSubbrandsByParentBrandId: findBrandsByParentBrandIdDB,
  makeQueryForCategories,
  // findManyByIds,
  findByCriteria,
} = require("./CategoryDao");
const CategoryMultilingualAttributeDao = require("./CategoryMultilingualAttributeDao");
const {
  getSubcategoriesByCategoryId: getSubcategoriesByCategoryIdRedis,
  getCategoriesByLocationId: getCategoriesByLocationIdRedis,
  getBrandsByLocationId: getBrandsByLocationIdRedis,
  getSubbrandsByBrandId: getSubbrandsByBrandIdRedis,
  setFunnelsSortedsetV2: createSortedSetRedis,
} = require("./FunnelDaoRedis");
const { toGetFunnelResponse } = require("./FunnelMapper");
const { findMaxProductPriority } = require("./CategoryProductJunctionDao");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const {
  redisService: { clearRedisEntity },
  constants: {
    CATEGORY_SUBCATEGORIES_KEY,
    LOCATION_CATEGORIES_KEY,
    BRAND_SUBBRANDS_KEY,
    LOCATION_BRANDS_KEY,
    FUNNEL_KEY,
  },
} = require("../Redis");
const {
  errors: {
    SUBCATEGORIES_NOT_FOUND,
    LOCATION_CATEGORIES_NOT_FOUND,
    SUBBRANDS_NOT_FOUND,
    LOCATION_BRANDS_NOT_FOUND,
  },
} = require("./Errors");
const {
  CATEGORY_TYPE,
  FUNNEL_PARENT_TYPE,
  FUNNEL_FLOW,
} = require("./Constants");
const {
  populateHierarchyAccess,
} = require("../../../services/AuthStoreService");
const { getAccountEmails } = require("../../../services/UtilService");
// const { sendMailThroughAmazon } = require("../../../services/MailerService");
const { createReadStream } = require("./Utils");
const xlsx = require("xlsx");
const { LANGUAGE } = require("../../../services/Constants");

/**
 * Gets parent categories by location id from Redis or DB
 * @param {Number} locationId
 * @param {Number} page
 * @param {Number} perPage
 * @returns {Object} categories and totalCategories
 */
const getEnabledParentCategoriesByLocationId = async (
  locationId,
  page,
  perPage,
) => {
  const { funnels: categories, totalFunnels } = await getFunnelsByParent(
    locationId,
    FUNNEL_PARENT_TYPE.LOCATION,
    CATEGORY_TYPE.CATEGORY,
    page,
    perPage,
  );
  return { categories, total: totalFunnels };
};

/**
 * Gets parent brands by location id from Redis or DB
 * @param {Number} locationId
 * @param {Number} page
 * @param {Number} perPage
 * @returns {Object} brands and totalBrands
 */
const getEnabledParentBrandsByLocationId = async (
  locationId,
  page,
  perPage,
) => {
  const { funnels: brands, totalFunnels } = await getFunnelsByParent(
    locationId,
    FUNNEL_PARENT_TYPE.LOCATION,
    CATEGORY_TYPE.BRAND,
    page,
    perPage,
  );
  return { brands, total: totalFunnels };
};

/**
 * Gets subcategories by parent category id from Redis or DB
 * @param {Number} parentCategoryId
 * @param {Number} page
 * @param {Number} perPage
 * @returns {Object} categories and totalCategories
 */
const getEnabledSubcategoriesByCategoryId = async (
  parentCategoryId,
  page,
  perPage,
) => {
  const { funnels: categories, totalFunnels } = await getFunnelsByParent(
    parentCategoryId,
    FUNNEL_PARENT_TYPE.FUNNEL,
    CATEGORY_TYPE.CATEGORY,
    page,
    perPage,
  );
  return { categories, total: totalFunnels };
};

/**
 * Gets subbrands by parent brand id from Redis or DB
 * @param {Number} parentBrandId
 * @param {Number} page
 * @param {Number} perPage
 * @returns {Object} brands and totalBrands
 */
const getEnabledSubbrandsByParentBrandId = async (
  parentBrandId,
  page,
  perPage,
) => {
  const { funnels: brands, totalFunnels } = await getFunnelsByParent(
    parentBrandId,
    FUNNEL_PARENT_TYPE.FUNNEL,
    CATEGORY_TYPE.BRAND,
    page,
    perPage,
  );
  return { brands, total: totalFunnels };
};


/**
 * Gets funnels by parent from Redis or DB
 * @param {Number} funnelParentId
 * @param {Number} funnelParentType
 * @param {Number} funnelType
 * @param {Number} page
 * @param {Number} perPage
 * @returns {Object} funnels and totalFunnels
 */
const getFunnelsByParent = async (
  funnelParentId,
  funnelParentType,
  funnelType,
  page,
  perPage,
) => {
  const logIdentifier = `API version: ${v1}, Context: FunnelService.getFunnelsByParent(),`;
  const funnelsFlowCase = decideFunnelsFlowCase(funnelParentType, funnelType);
  let {
    entities: funnels,
    // eslint-disable-next-line prefer-const
    total: totalFunnels,
  } = await getFunnelsByParentRedis(
    funnelsFlowCase,
    funnelParentId,
    page,
    perPage,
  );
  sails.log(
    `${logIdentifier} Redis funnels response -> funnels: ${JSON.stringify(
      funnels,
    )}, totalFunnels: ${totalFunnels}`,
  );
  if (_.isEmpty(funnels)) {
    const { skip, limit } = getPagination(+page, +perPage);
    funnels = await findFunnelsByFunnelParentIdDB(
      funnelsFlowCase,
      funnelParentId,
    );
    totalFunnels = funnels.length;
    sails.log(
      `${logIdentifier} DB funnels response -> funnels: ${JSON.stringify(
        funnels,
      )}, totalFunnels: ${totalFunnels}`,
    );
    if (!_.isEmpty(funnels)) {
      funnels = sortArrayAscendingNullsToEnd(funnels, "priority");
      setFunnelsSortedSetRedis(funnelsFlowCase, funnelParentId, funnels);
      funnels = funnels.slice(skip, skip + limit); // slicing here
    } else {
      sails.log.error(
        `${logIdentifier} no funnels found against this parent category!!`,
      );
      throw constructEmptyFunnelsResponseError(funnelsFlowCase);
    }
  }

  funnels = funnels.map(funnel => toGetFunnelResponse(funnel));
  return { funnels, totalFunnels };
};

/**
 * Gets funnels flow identidier
 * @param {Number} funnelParentType
 * @param {Number} funnelType
 * @returns {Number} funnel flow identifier
 */
const decideFunnelsFlowCase = (funnelParentType, funnelType) => {
  if (funnelParentType === FUNNEL_PARENT_TYPE.LOCATION) {
    if (funnelType === CATEGORY_TYPE.CATEGORY) {
      return FUNNEL_FLOW.LOCATION_CATEGORIES;
    } else if (funnelType === CATEGORY_TYPE.BRAND) {
      return FUNNEL_FLOW.LOCATION_BRANDS;
    }
  } else if (funnelParentType === FUNNEL_PARENT_TYPE.FUNNEL) {
    if (funnelType === CATEGORY_TYPE.CATEGORY) {
      return FUNNEL_FLOW.CATEGORY_SUBCATEGORIES;
    } else if (funnelType === CATEGORY_TYPE.BRAND) {
      return FUNNEL_FLOW.BRAND_SUBBRANDS;
    }
  }
  return FUNNEL_FLOW.UNDETERMINED;
};

/**
 * Gets funnels by parent from Redis
 * @param {Number} funnelsFlowCase
 * @param {Number} funnelParentId
 * @param {Number} page
 * @param {Number} perPage
 * @returns {Object} funnels, their ids and totalFunnels
 */
const getFunnelsByParentRedis = async (funnelsFlowCase, funnelParentId, page, perPage) => {
  switch (funnelsFlowCase) {
    case FUNNEL_FLOW.LOCATION_CATEGORIES:
      return getCategoriesByLocationIdRedis(funnelParentId, page, perPage);

    case FUNNEL_FLOW.LOCATION_BRANDS:
      return getBrandsByLocationIdRedis(funnelParentId, page, perPage);

    case FUNNEL_FLOW.CATEGORY_SUBCATEGORIES:
      return getSubcategoriesByCategoryIdRedis(funnelParentId, page, perPage);

    case FUNNEL_FLOW.BRAND_SUBBRANDS:
      return getSubbrandsByBrandIdRedis(funnelParentId, page, perPage);

    default:
      sails.log.error(
        `API version: ${v1}, 
        Context: FunnelService.getFunnelsByParentRedis(), 
        Cannot find funnels from Redis, no proper funnel type was supplied!!`,
      );
      return { entities: [], ids: [], total: 0 };
  }
};

/**
 * Gets funnels against a parent from DB
 * @param {Number} funnelsFlowCase
 * @param {Number} funnelParentId
 * @returns {Array} funnels found from DB
 */
const findFunnelsByFunnelParentIdDB = async (funnelsFlowCase, funnelParentId) => {
  switch (funnelsFlowCase) {
    case FUNNEL_FLOW.LOCATION_CATEGORIES:
      return findParentCategoriesByLocationIdDB(funnelParentId);

    case FUNNEL_FLOW.LOCATION_BRANDS:
      return findParentBrandsByLocationIdDB(funnelParentId);

    case FUNNEL_FLOW.CATEGORY_SUBCATEGORIES:
      return findCategoriesByParentCategoryIdDB(funnelParentId);

    case FUNNEL_FLOW.BRAND_SUBBRANDS:
      return findBrandsByParentBrandIdDB(funnelParentId);

    default:
      sails.log.error(`API version: ${v1}, 
      Context: FunnelService.findFunnelsByFunnelParentIdDB(),
      Cannot find funnels from DB, no proper funnel type was supplied!!`);
      return [];
  }
};

/**
 * Creates Funnels sorted set in Redis
 * @param {Number} funnelsFlowCase
 * @param {Number} funnelParentId
 * @param {Array} funnels
 * @returns
 */
const setFunnelsSortedSetRedis = (funnelsFlowCase, funnelParentId, funnels) => {
  switch (funnelsFlowCase) {
    case FUNNEL_FLOW.LOCATION_CATEGORIES:
      return createSortedSetRedis(`${LOCATION_CATEGORIES_KEY}${funnelParentId}`, funnels, "priority");

    case FUNNEL_FLOW.LOCATION_BRANDS:
      return createSortedSetRedis(`${LOCATION_BRANDS_KEY}${funnelParentId}`, funnels, "priority");

    case FUNNEL_FLOW.CATEGORY_SUBCATEGORIES:
      return createSortedSetRedis(`${CATEGORY_SUBCATEGORIES_KEY}${funnelParentId}`, funnels, "priority");

    case FUNNEL_FLOW.BRAND_SUBBRANDS:
      return createSortedSetRedis(`${BRAND_SUBBRANDS_KEY}${funnelParentId}`, funnels, "priority");

    default:
      sails.log.error(`API version: ${v1}, 
      Context: FunnelService.setFunnelsRedis(),
      Cannot set funnels in Redis, no proper funnel type was supplied!!`);
      // eslint-disable-next-line consistent-return
      return;
  }
};

/**
 * Gets appropriate error object for get funnels depending on the request type
 * @param {Number} funnelsFlowCase
 * @returns {Object} error object
 */
const constructEmptyFunnelsResponseError = funnelsFlowCase => {
  switch (funnelsFlowCase) {
    case FUNNEL_FLOW.LOCATION_CATEGORIES:
      return LOCATION_CATEGORIES_NOT_FOUND();

    case FUNNEL_FLOW.LOCATION_BRANDS:
      return LOCATION_BRANDS_NOT_FOUND();

    case FUNNEL_FLOW.CATEGORY_SUBCATEGORIES:
      return { data: SUBCATEGORIES_NOT_FOUND() };

    case FUNNEL_FLOW.BRAND_SUBBRANDS:
      return SUBBRANDS_NOT_FOUND();

    default:
      return FUNNELS_NOT_FOUND();
  }
};

/**
 * Function fills null funnels returned by Redis, from DB
 * @param {Array} funnelsRedis
 * @param {Array} funnelIdsRedis
 * @return {Array} funnels array without nulls
 */
// const fillRedisFunnelNullsFromDB = async (funnelsRedis, funnelIdsRedis) => {
//   const logIdentifier = `API version: ${v1}, Context: FunnelService.fillRedisFunnelNullsFromDB(),`;
//   sails.log(
//     `${logIdentifier} called with params ->
//     funnelsRedis: ${JSON.stringify(funnelsRedis)},
//     funnelIdsRedis: ${funnelIdsRedis}`,
//   );
//   const nullFunnelIds = [];
//   const nullFunnelIndices = [];
//   const lastIndexOfNull = funnelsRedis.lastIndexOf(null);
//   // iterate over funnels response from Redis to fetch ids and indices for null funnels
//   for (let i = 0; i <= lastIndexOfNull; i++) {
//     if (funnelsRedis[i] === null) {
//       nullFunnelIds.push(funnelIdsRedis[i]);
//       nullFunnelIndices.push(i);
//     }
//   }
//   const missingFunnels = await findManyByIds(nullFunnelIds);
//   // iterate over null funnels and replace them with funnels from the DB
//   for (const index in nullFunnelIndices) {
//     if (Object.prototype.hasOwnProperty.call(nullFunnelIndices, index)) {
//       funnelsRedis[nullFunnelIndices[index]] = missingFunnels[index];
//     }
//   }
//   return [funnelsRedis, missingFunnels];
// };

/**
 * Clears sorted set from Redis
 * @param {Object} funnel
 * @returns {String} Redis del response
 */
const clearSortedsetRedis = async funnel => {
  const logIdentifier = `API version: ${v1}, Context: FunnelService.clearSortedsetRedis(),`;
  sails.log(`${logIdentifier} called with -> ${JSON.stringify(funnel)}`);
  const clearSortedsetRes = {};
  if (funnel.type === CATEGORY_TYPE.CATEGORY) {
    if (funnel.parent) {
      sails.log(`${logIdentifier} removing sortedset -> ${CATEGORY_SUBCATEGORIES_KEY}${funnel.parent}`);
      clearSortedsetRes.clearCategorySubcategoriesRes = clearRedisEntity(
        `${CATEGORY_SUBCATEGORIES_KEY}${funnel.parent}`,
      );
    } else {
      sails.log(`${logIdentifier} removing sortedset -> ${LOCATION_CATEGORIES_KEY}${funnel.location_id}`);
      clearSortedsetRes.clearLocationCategoriesRes = clearRedisEntity(
        `${LOCATION_CATEGORIES_KEY}${funnel.location_id}`,
      );
      clearSortedsetRes.clearCategorySubcategoriesRes = clearRedisEntity(`${CATEGORY_SUBCATEGORIES_KEY}${funnel.id}`);
    }
  } else if (funnel.type === CATEGORY_TYPE.BRAND) {
    if (funnel.parent) {
      sails.log(`${logIdentifier} removing sortedset -> ${BRAND_SUBBRANDS_KEY}${funnel.parent}`);
      clearSortedsetRes.clearBrandSubbrandsRes = clearRedisEntity(`${BRAND_SUBBRANDS_KEY}${funnel.parent}`);
    } else {
      sails.log(`${logIdentifier} removing sortedset -> ${LOCATION_BRANDS_KEY}${funnel.location_id}`);
      clearSortedsetRes.clearLocationBrandsRes = clearRedisEntity(`${LOCATION_BRANDS_KEY}${funnel.location_id}`);
      clearSortedsetRes.clearBrandSubbrandsRes = clearRedisEntity(`${BRAND_SUBBRANDS_KEY}${funnel.id}`);
    }
  }
  return clearSortedsetRes;
};

/**
 * Clears a funnel from Redis
 * @param {Number} funnelId
 * @returns {String} Redis del response
 */
const clearFunnelFromRedis = async funnelId => {
  sails.log(`API version: ${v1}, 
  Context: FunnelService.clearSortedsetRedis(),
  clearing category -> ${FUNNEL_KEY}${funnelId}`);
  return clearRedisEntity(`${FUNNEL_KEY}${funnelId}`);
};

/**
 * Bulk update funnel languages
 * @param {String} fileName
 * @param {Number} locationId
 * @param {Object} userData
 */
const bulkUpdateLanguages = async (fileName, locationId, userData) => {
  const logIdentifier = `API version: ${v1}, Context: FunnelService.bulkUpdateLanguages(),`;
  const errorIds = [];
  const updateCategories = [];
  const createCategories = [];
  const stream = createReadStream(fileName);
  stream.on("data", async dataChunk => { // Get data in chunks instead of all at once
    const dataArray = [dataChunk];
    const workbook = xlsx.read(Buffer.concat(dataArray));
    const sheetList = workbook.SheetNames;
    const languageData = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetList[0]], // Get first sheet only
    );
    const allIds = languageData.map(category => category.id);
    const categories = await findByCriteria({ id: allIds, locationId });
    for (const data of languageData) {
      const { id, attribute } = data;
      if (!id) {
        continue;
      }
      const category = categories.find(item => +item.id === +id);
      if (_.isEmpty(category)) {
        errorIds.push(id);
        continue;
      }
      for (const [key] of Object.entries(data)) {
        if (data[key]) {
          if (Object.values(LANGUAGE).find(language => language === key)) {
            const criteria = { categoryId: id, language: key, attributeName: attribute };
            if (category.multilingual.find(language => language.language === key)) {
              updateCategories.push(CategoryMultilingualAttributeDao.update(criteria, { value: data[key] }));
            } else {
              createCategories.push({ ...criteria, value: data[key] });
            }
          }
        }
      }
    }
    if (!_.isEmpty(updateCategories)) await Promise.all(updateCategories);
    if (!_.isEmpty(createCategories)) await CategoryMultilingualAttributeDao.bulkCreate(createCategories);
    sails.log(`${logIdentifier} Error Ids -> ${errorIds}`);
    sendCategoryLanguageMail(errorIds, userData); // send mail code is commented inside this function
  });
};

const sendCategoryLanguageMail = async (errorIds, userData) => {
  // let html = "";
  if (errorIds.length > 0) {
    html = "<h2>CATEGORY LANGUAGE UPDATED FAILED</h2>";
    html += "<p>" + "The language could not be updated for these Ids: " + errorIds + "</p>";
  } else {
    html = "<h2>CATEGORY LANGUAGE UPDATED SUCCESSFULLY</h2>";
  }
  const user = await populateHierarchyAccess(userData);
  const recipients = await getAccountEmails(user);
  if (!_.isEmpty(userData.email)) recipients.push(userData.email);
  // sendMailThroughAmazon({
  //   email: recipients,
  //   htmlpart: html,
  //   subject: "CATEGORY LANGUAGE UPDATED REPORT - " + new Date(),
  // });
};

/**
 * Get max product priority for categories
 * @param {Object} categories
 */
const getMaxProductPriority = async categories => {
  sails.log(`API version: ${v1}, Context: FunnelService.getMaxProductPriority() `);
  // TODO get max priority in bulk to reduce db calls
  for (const category of categories) {
    let maxProductPriority = await findMaxProductPriority(category.id);
    if (!maxProductPriority) maxProductPriority = 0; // Adding first product to category.
    else if (!maxProductPriority.productPriority) maxProductPriority = 1;
    else maxProductPriority = maxProductPriority.productPriority;
    category.maxProductPriority = maxProductPriority;
    for (const subCategory of category.sub_categories) {
      // eslint-disable-next-line no-shadow
      let maxProductPriority = await findMaxProductPriority(category.id);
      if (!maxProductPriority) maxProductPriority = 0;
      else if (!maxProductPriority.productPriority) maxProductPriority = 1;
      else maxProductPriority = maxProductPriority.productPriority;
      subCategory.maxProductPriority = maxProductPriority;
    }
  }
};

/**
 * Get categories or bands based on the params.
 * @param {Number} category_id
 * @param {Number} type (0/1)(category/brand)
 * @param {String} disabled_at (disabled_at)
 * @param {String} parent_id (L1, L2)
 * @param {Number} location_id
 * @returns
 */
const getBrandsOrCategoriesByParams = async (category_id, type, disabled_at, parent_id, location_id) => {
  const query  = makeQueryForCategories(category_id, type, disabled_at, parent_id, location_id);
  const data = await sails.getDatastore("readReplica").sendNativeQuery(query);
  return data.rows;
};

module.exports = {
  getEnabledParentCategoriesByLocationId,
  getEnabledParentBrandsByLocationId,
  getEnabledSubcategoriesByCategoryId,
  getEnabledSubbrandsByParentBrandId,
  clearSortedsetRedis,
  clearFunnelFromRedis,
  bulkUpdateLanguages,
  getBrandsOrCategoriesByParams,
  getMaxProductPriority,
};

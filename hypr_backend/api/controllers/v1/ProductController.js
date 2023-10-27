const {
  productService: {
    getProductsByCategory,
    getProductsByBrand,
    searchProductsFromEs,
    bulkUpdateLanguages,
    likeProducts,
    getProductsLiked,
    productsWithLikeTag,
    previousOrderedProducts,
    allPreviousOrderedProducts,
    recommendedProduct,
    upsertRecommendedProduct,
    upsertGenericProduct,
    findProductIdById,
    findProducts,
    findProductsBySkus,
  },
} = require("../../modules/v1/Product");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../constants/http");
const { likeProductCustomerJunctionDao: { getLikeProductIds },
} = require("../../modules/v1/LikeProductCustomerJunction");
const { getFormattedLanguage } = require("../../modules/v1/Product/Utils");
const { checkJITStatusBasedOnAppVersion } = require("../../modules/v1/JIT");


/**
 * getProducts controller function
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Array} products
 */
const getProducts = async (req, res) => {
  const {
    query: {
      categoryId,
      customerId,
      brandId,
      locationId,
      zones,
      shopTypeId,
      page,
      perPage,
    },
    user: {
      userId,
      role,
    },
    headers: {
      language: _lang = "EN",
      app_version,
      os,
      clienttimeoffset: clientTimeOffset,
    },
  } = req;

  const language = getFormattedLanguage(_lang);

  const logIdentifier =
    `API version: ${v1}, context: ProductController.getProducts(), UserId: ${userId}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    const isJitEnabledForUser = checkJITStatusBasedOnAppVersion(app_version, os);
    let products = [];
    if (categoryId) {
      sails.log(`${logIdentifier} In products by category flow`);
      if (customerId) {
        const [{ value: productslist, status, reason }, likedProducts] =
          await Promise.allSettled(
            [getProductsByCategory(
              categoryId, page, perPage, customerId, language, isJitEnabledForUser, clientTimeOffset,
              locationId, zones, shopTypeId,
            ),
            getLikeProductIds({ customerId })]);
        if (status === "rejected") {
          throw reason;
        } else {
          products = productsWithLikeTag(productslist, likedProducts);
        }
      } else {
        products = await getProductsByCategory(
          categoryId, page, perPage, userId, language, isJitEnabledForUser, clientTimeOffset,
          locationId, zones, shopTypeId,
        );
      }
    } else if (brandId) {
      sails.log(`${logIdentifier} In products by brand flow`);
      if (customerId) {
        const [{ value: productslist, status, reason }, likedProducts] =
          await Promise.allSettled([
            getProductsByBrand(brandId, page, perPage, customerId, language, isJitEnabledForUser, clientTimeOffset,
              locationId, zones, shopTypeId),
            getLikeProductIds({ customerId }),
          ]);
        if (status === "rejected") {
          throw reason;
        } else {
          products = productsWithLikeTag(productslist, likedProducts);
        }
      } else {
        products = await getProductsByBrand(
          brandId, page, perPage, userId, language, isJitEnabledForUser, clientTimeOffset,
          locationId, zones, shopTypeId,
        );
      }
    }
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(products)}`);
    res.ok(products);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

const getProductsFromSkus = async (req, res) => {
  const {
    query: {
      sku,
      getLocationName,
    },
  } = req;

  const logIdentifier =
    `API version: ${v1}, context: ProductController.getProductsFromSkus(), sku: ${JSON.stringify(sku)},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    const products = await findProductsBySkus(sku, getLocationName);
    res.ok(products);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

/**
 * GET products from aws elastic search
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Array} products
 */
const searchFromEs = async (req, res) => {
  let userId = null;
  const {
    query: {
      search,
      locationId,
      zones,
      shopTypeId,
      customerId,
      page,
      perPage,
    },
    user: {
      id,
      role,
    },
    headers: {
      language: _lang = "EN",
      app_version,
      os,
      clienttimeoffset: clientTimeOffset,
    },
  } = req;

  const language = getFormattedLanguage(_lang);

  userId = customerId || id; // incase of sales agent flow the customerId will be provided as an URL param.
  const logIdentifier = `API version: ${v1}, context: ProductController.searchFromEs(), UserId: ${id}, ` +
    `Role: ${role}, Language: ${language},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    const isJitDisabledForUser = !checkJITStatusBasedOnAppVersion(app_version, os);
    const products =
      await searchProductsFromEs(
        search, locationId, page, perPage, userId, language, isJitDisabledForUser, clientTimeOffset,
        zones, shopTypeId,
      );
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(products)}`);
    res.ok(products);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

/**
 * Update product languages
 *
 * @param {Object} req
 * @param {Object} res
 */
const updateLanguages = async (req, res) => {
  const logIdentifier = `API version: ${v1}, context: ProductController.updateLanguages(),`;
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
const likeProduct = async (req, res) => {
  const { body: { customerId, productId, isLiked, isToolTip }, user: { id, role } } = req;
  const logIdentifier = `API version: ${v1}, context: ProductController.likeProduct(), UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    await likeProducts({ customerId, productId, isLiked, isToolTip });
    res.ok();
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};

const getLikedProducts = async (req, res) => {
  const {
    query: {
      customerId,
      zones,
      shopTypeId,
      page,
      perPage,
    },
    user: {
      id,
      location: {
        location_id: locationId,
      },
      role,
    },
    headers: {
      language: _lang = "EN",
      app_version,
      os,
      clienttimeoffset: clientTimeOffset,
    },
  } = req;
  const language = getFormattedLanguage(_lang);

  const logIdentifier = `API version: ${v1}, context: ProductController.getLikedProducts(),` +
    `UserId: ${id}, Role: ${role}, locationId: ${locationId}`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    const isJitEnabledForUser = checkJITStatusBasedOnAppVersion(app_version, os);
    const likedProducts = await getProductsLiked(
      customerId, locationId, page, perPage, language, isJitEnabledForUser, clientTimeOffset,
      zones, shopTypeId,
    );

    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(likedProducts)}`);
    res.ok(likedProducts);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};
const previousOrderedItems = async (req, res) => {
  const {
    query: {
      customerId,
      shopTypeId,
      zones,
      page,
      perPage,
    },
    user: {
      id,
      location: {
        location_id: locationId,
      },
      role,
    },
    headers: {
      language: _lang = "EN",
      app_version,
      os,
      clienttimeoffset: clientTimeOffset,
    },
  } = req;

  const language = getFormattedLanguage(_lang);

  const logIdentifier =
    `API version: ${v1}, context: ProductController.previousOrderedItems(),` +
    `UserId: ${id}, Role: ${role}, LocationId: ${locationId}`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    const isJitEnabledForUser = checkJITStatusBasedOnAppVersion(app_version, os);
    const products =
      await previousOrderedProducts(
        customerId, locationId, page, perPage, language, isJitEnabledForUser, clientTimeOffset,
        zones, shopTypeId,
      );
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(products)}`);
    res.ok(products);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};
const frequentlyOrderedItems = async (req, res) => {
  const {
    query: {
      customerId,
      page,
      perPage,
      zones,
      shopTypeId,
    },
    user: {
      id,
      location: {
        location_id: locationId,
      },
      role,
    },
    headers: {
      language: _lang = "EN",
      app_version,
      os,
      clienttimeoffset: clientTimeOffset,
    },
  } = req;

  const language = getFormattedLanguage(_lang);

  const logIdentifier =
    `API version: ${v1}, context: ProductController.frequentlyOrderedItems(),` +
    `UserId: ${id}, Role: ${role}, LocationId: ${locationId}`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    const isJitEnabledForUser = checkJITStatusBasedOnAppVersion(app_version, os);
    const products =
      await allPreviousOrderedProducts(
        customerId, locationId, page, perPage, language, isJitEnabledForUser, clientTimeOffset,
        zones, shopTypeId,
      );
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(products)}`);
    res.ok(products);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};
const recommendedProducts = async (req, res) => {
  const {
    query: {
      customerId,
      locationId,
      zones,
      shopTypeId,
      page,
      perPage,
    },
    user: {
      id,
      role,
    },
    headers: {
      language: _lang = "EN",
      app_version,
      os,
      clienttimeoffset: clientTimeOffset,
    },
  } = req;

  const language = getFormattedLanguage(_lang);

  const logIdentifier =
    `API version: ${v1}, context: ProductController.recommendedProducts(),` +
    `UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    const isJitEnabledForUser = checkJITStatusBasedOnAppVersion(app_version, os);
    const products = await recommendedProduct(
      customerId, locationId, page, perPage, language, isJitEnabledForUser, clientTimeOffset,
      zones, shopTypeId,
    );

    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(products)}`);
    res.ok(products);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};
const upsertRecommendedProducts = async (req, res) => {
  const { body: { customerId, productIds } } = req;
  const logIdentifier =
    `API version: ${v1}, context: ProductController.upsertRecommendedProducts(),` +
    `UserId: ${customerId}`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.body)}`);
    const products = await upsertRecommendedProduct(customerId, productIds);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(products)}`);
    res.ok(products);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};
const upsertGenericProducts = async (req, res) => {
  const { body: { locationId, productIds } } = req;
  const logIdentifier =
    `API version: ${v1}, context: ProductController.upsertGenericProducts(),` +
    `locationId: ${locationId}`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.body)}`);
    const products = await upsertGenericProduct(locationId, productIds);
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(products)}`);
    res.ok(products);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};


/**
 * getProductIdForExternalResource function to get a product id.
 * Using function to check weather product id exists in the monolith or not.
 * It will become the part of product service in future but for now other services uses this function to get an id.
 *
 * @param {Object} req
 * @param {Object} res
 */
const getProductIdForExternalResource = async (req, res) => {
  const { params: { id } } = req;
  const logIdentifier = `API version: ${v1}, context: ProductController.getProductIdForExternalResource(),`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const productId = await findProductIdById(id);
    res.ok(productId);
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    res.error(error);
  }
};


/**
 * getProductsForExternalResource controller function
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Array} products
 */
const getProductsForExternalResource = async (req, res) => {
  const { query: { sku, locationId } } = req;
  const logIdentifier =
    `API version: ${v1}, context: ProductController.getProductsForExternalResource(),`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);
    const products = await findProducts({ sku: sku && sku[0] === "[" ? JSON.parse(sku) : sku, locationId });
    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(products)}`);
    res.ok(products);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

/**
 * GET products for portal
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Array} products
 */
const getProductsForPortal = async (req, res) => {
  const { query: { sku, id: productId, locationId, select }, user: { id, role } } = req;
  const logIdentifier =
    `API version: V1, context: ProductController.getProductsForPortal(), UserId: ${id}, Role: ${role},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.query)}`);

    const criteria = { where: { locationId } };

    if (sku) {
      criteria.where.sku = sku.split(",");
    }

    if (productId) {
      criteria.where.id = productId.split(",");
    }

    if (select) {
      criteria.select = select.split(",");
    }

    const products = await findProducts(criteria);

    sails.log(`${logIdentifier} responding with -> ${JSON.stringify(products)}`);
    res.ok(products);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

module.exports = {
  getProducts,
  getProductsFromSkus,
  searchFromEs,
  updateLanguages,
  likeProduct,
  getLikedProducts,
  previousOrderedItems,
  frequentlyOrderedItems,
  recommendedProducts,
  upsertRecommendedProducts,
  upsertGenericProducts,
  getProductIdForExternalResource,
  getProductsForExternalResource,
  getProductsForPortal,
};

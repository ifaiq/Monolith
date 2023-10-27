const { findById, setProductsSortedSet, setProducts } = require("./ProductDaoRedis");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const { getPagination, sortArrayAscendingNullsToEnd } = require("../../../../utils/services");
const {
  // TODO: Should not import directly from DAO, should go through service instead
  productCategoriesJunctionDao: {
    findProductIdsFromCategoriesJunction,
    findByProductId,
  },
} = require("../ProductCategoriesJunction");
const { toGetProductsResponse, toESProductFields, toProductIdDto } = require("./ProductMapper");
const { errors: { FUNNEL_PRODUCTS_NOT_FOUND } } = require("./Errors");
const {
  redisService: {
    multiAsyncGetSortedSetWithScores,
    multiAsyncGet,
    clearRedisEntity,
    locking,
    unLocking,
    separateIdsFromPrioritiesDict,
  },
  constants: { FUNNEL_PRODUCTS_KEY, PRODUCT_KEY, FUNNEL_JIT_PRODUCTS_KEY },
} = require("../Redis");
const locationExtractionService = require("../../../config_service_extraction/locationsExtraction");
const camelcaseKeys = require("camelcase-keys");
const productDao = require("./ProductDao");
const volumeBasedProductPriceDao = require("./VolumeBasedProductPriceDao");
const ProductMultilingualAttributeDao = require("./ProductMultilingualAttributeDao");
const { TAX_CATEGORIES: { TAX_ON_PRICE } } = require("../../../services/Constants.js");

const {
  validateProductStock,
  removedOutofStockProducts,
  validateVolumeBasedProducts,
} = require("./ProductValidator");

const {
  arithmos: {
    getConsumerPriceForProduct,
    getAdjustedVolumeBasedProductPrices,
  },
} = require("../Arithmos");
const { MultiLingualAttributes } = require("../../../constants/enums");
// const { getLanguage } = require("../../../../utils/languageAccessor");
// const { sendMailThroughAmazon } = require("../../../services/MailerService");
const { getAccountEmails } = require("../../../services/UtilService");
const { populateHierarchyAccess } = require("../../../services/AuthStoreService");
const { LANGUAGE } = require("../../../services/Constants");
const { createReadStream, sortProperties, sortProducts, countUniqueProduct } = require("./Utils");
const xlsx = require("xlsx");
const {
  likeProductCustomerJunctionDao: {
    createLikeProduct,
    unLikeProduct,
    getLikeProductIds,
  },
} = require("../LikeProductCustomerJunction");
// const { updateProfile } = require("../Auth/UserService");
/**
 * Importing from Dao  due to facing issue with cirdular dependency
 */
const { findAll: findOrders } = require("../Order/OrderDao");
const { getDeliveryDate } = require("../JIT/JITUtils");

const { findOne: findOneBusinessUnit } = require("../BusinessUnit/BusinessUnitService");
const customerExtractionService = require("../../../user_service_extraction/customerService");
const { locationService: { findLocation } } = require("../Location");
const { businessUnitService: { getBusinessUnitById } } = require("../BusinessUnit");
const { getUpdatedProductStock } = require("../ProductQuantityLimit");
const { calculateTaxAndPriceByCategory } = require("../Arithmos/Arithmos");
const pricingEngineService = require("../../../pricing_engine_service/pricingEngineService");

/**
 * This function takes the id and return product.
 *
 * @param {Number} id
 * @returns {Object} product
 */
const findProductById = async id => await findById(id);

/**
 * This function takes the ids and return products.
 *
 * @param {Array} ids
 * @returns {Object} product
 */
const findProductByIds = async ids => await productDao.findManyByIds(ids);

const findProductsBySkus = async (skus, getLocationName = false) => {
  const products = await productDao.findManyBySkus(skus);
  if (products) {
    const result = products.map(async item => {
      if (getLocationName === "true") {
        const name = await locationExtractionService.find({ id: item.location_id, allData: true });
        return {
          ...item,
          location_name: name.length > 0 ? name[0].name : "",
        };
      }
      return {
        ...item,
      };
    });
    return await Promise.all(result);
  }
  return "No products found";
};


const getProductsFromRedis = async (categoryId, page, perPage) => {
  const logIdentifier = `API version: ${v1}, Context: ProductService.getProductsFromRedis(),`;
  try {
    sails.log(
      `${logIdentifier} called with params -> categoryId: ${categoryId}, page: ${page}, perPage: ${perPage}`);

    const [productIdsWithScore, totalProducts] =
      await multiAsyncGetSortedSetWithScores(
        categoryId,
        page,
        perPage,
      );

    const [productIds, mappedProductPrioritiesRedis] =
      separateIdsFromPrioritiesDict(productIdsWithScore);

    sails.log(
      `${logIdentifier} products sortedSet response -> productIds: ${productIds}, totalProducts: ${totalProducts}`,
    );
    if (totalProducts !== 0) {
      const productKeys = productIds.map(proId => `${PRODUCT_KEY}${proId}`);
      const products = (await multiAsyncGet(productKeys)).map(product =>
        camelcaseKeys(JSON.parse(product)),
      );
      return {
        products,
        productIds,
        mappedProductPrioritiesRedis,
        totalProducts,
      };
    }
    return {
      products: [],
      productIds,
      mappedProductPrioritiesRedis,
      totalProducts,
    };
  } catch (err) {
    sails.log.error(
      `${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`,
    );
    return err;
  }
};

const fillRedisProductNullsFromDB = async (productsRedis, productIdsRedis) => {
  const logIdentifier = `API version: ${v1}, Context: ProductService.fillRedisProductNullsFromDB(),`;
  sails.log(
    `${logIdentifier} called with params -> productsRedis: ${JSON.stringify(productsRedis)},`,
    `productIdsRedis: ${productIdsRedis}`,
  );
  const nullProductIds = [];
  const nullProductIndices = [];
  const lastIndexOfNull = Math.max(productsRedis.lastIndexOf(null), productsRedis.lastIndexOf(undefined));
  // iterate over products response from Redis to fetch ids and indices for null products
  for (let i = 0; i <= lastIndexOfNull; i++) {
    if (!productsRedis[i]) {
      nullProductIds.push(productIdsRedis[i]);
      nullProductIndices.push(i);
    }
  }
  // get missing products from DB
  const missingProducts = await productDao.findManyByIds(nullProductIds);
  // iterate over null products and replace them with ones from the DB
  for (const index in nullProductIndices) {
    if (Object.prototype.hasOwnProperty.call(nullProductIndices, index)) {
      productsRedis[nullProductIndices[index]] = missingProducts.find(
        element => element.id === nullProductIds[index],
      );
    }
  }

  const filteredProductsRedis = productsRedis.filter(product => product);
  return [filteredProductsRedis, missingProducts];
};

/**
 * This function gets products in a funnel from the database, after attempting retrieval from Redis
 * @param {Number} funnelId
 * @param {Number} page
 * @param {Number} perPage
 * @param {Number} customerId
 * @returns {Array} products
 */
const getProductsByFunnel =
  async (funnelId, page = 1, perPage = 20, customerId, language = "EN", isJitEnabledForUser, clientTimeOffset,
    locationId, zones, shopTypeId) => {
    const logIdentifier = `API version: ${v1}, Context: ProductService.getProductsByFunnel,`;
    try {
      sails.log(`${logIdentifier} called with params -> funnelId: ${funnelId}, page: ${page}, perPage: ${perPage}`);

      const isCompleteResponseFromDb = false;
      const { skip, limit } = getPagination(+page, +perPage);
      const redisKey =
        isJitEnabledForUser ? `${FUNNEL_JIT_PRODUCTS_KEY}${funnelId}${locationId}`
          : `${FUNNEL_PRODUCTS_KEY}${funnelId}${locationId}`;
      // Attempt fetch from Redis
      // eslint-disable-next-line prefer-const
      let { products, productIds, mappedProductPrioritiesRedis, totalProducts } =
        await getProductsFromRedis(redisKey, page, perPage);

      sails.log(
        `${logIdentifier} Redis products response -> products: ${JSON.stringify(products)},`,
        `productIds: ${JSON.stringify(productIds)},`,
        `totalProducts: ${totalProducts}`,
      );

      // If response from Redis is empty, attempt fetch from DB and populate Redis
      if (_.isEmpty(products)) {
        const junctionResponse = await findProductIdsFromCategoriesJunction(
          funnelId,
        );
        let productsResponse;
        if (isJitEnabledForUser) {
          productsResponse = await productDao.findEnabledProductsByIds(
            junctionResponse.map(_item => _item.productId), locationId,
          );
        } else {
          productsResponse = await productDao.findNonJitEnabledProductsByIds(
            junctionResponse.map(_item => _item.productId), locationId,
          );
        }
        const mappedProductPrioritiesDb = junctionResponse.reduce(
          (resultObject, product) => {
            resultObject[product.productId] = product.productPriority;
            return resultObject;
          },
          {},
        );
        products = _.cloneDeep(productsResponse).map(product => {
          product.productPriority = mappedProductPrioritiesDb[product.id];
          return product;
        });
        // If DB fetch successful, set products in Redis
        if (!_.isEmpty(products)) {
          totalProducts = products.length;
          let inStockProducts = products.filter(product => product.stockQuantity > 0);
          sails.log(`${logIdentifier} extracting in stock products ${JSON.stringify(inStockProducts)}`);
          let outStockProducts = products.filter(product => product.stockQuantity === 0);
          sails.log(`${logIdentifier} extracting out of stock products ${JSON.stringify(outStockProducts)}`);
          inStockProducts = sortArrayAscendingNullsToEnd(inStockProducts, "productPriority");
          sails.log(`${logIdentifier} sorting in stock products ${JSON.stringify(inStockProducts)}`);
          outStockProducts = sortArrayAscendingNullsToEnd(outStockProducts, "productPriority");
          sails.log(`${logIdentifier} sorting out of stock products ${JSON.stringify(outStockProducts)}`);
          products = [...inStockProducts, ...outStockProducts];
          setProductsSortedSet(
            redisKey,
            products,
            "",
          );
          setProducts(productsResponse);
          products = products.slice(skip, skip + limit);
        } else {
          sails.log.error(`${logIdentifier}, no products found in this funnel!!`);
          throw FUNNEL_PRODUCTS_NOT_FOUND();
        }
      } else if (products.includes(null) || products.includes(undefined)) {
        // If response from Redis is incomplete, attempt fetch remaining items from DB
        [products, missingProducts] = await fillRedisProductNullsFromDB(
          products,
          productIds,
        );
        setProducts(missingProducts);

        sails.log(
          `${logIdentifier} products after filling Redis response nulls using DB -> ${JSON.stringify(products)}`,
          `${JSON.stringify(missingProducts)}`,
        );
      }
      // Sort, paginate, and standardize response
      if (!isCompleteResponseFromDb) {
        products = products.map(product => {
          if (!product.productPriority) {
            if (mappedProductPrioritiesRedis[product.id] === "inf") {
              product.productPriority = null;
            } else {
              product.productPriority = +mappedProductPrioritiesRedis[product.id];
            }
          }
          return product;
        });
      }
      sails.log(`${logIdentifier} Products before price calculation and mapping -> ${JSON.stringify(products)}`);
      let customer;
      // Incase there is a customerId we will fetch the country_code to calculate the expected delivery date
      if (customerId) {
        customer = await customerExtractionService.findOne({ id: customerId });
        if (customer?.business_unit_id) {
          customer.business_unit_id = await findOneBusinessUnit({ id: customer.business_unit_id });
        }
      }
      products = await getUpdatedProductStock(customerId, products, clientTimeOffset);
      // Funnel Injection | Pricing Engine | Dynamic Pricing
      products = await pricingEngineService.getUpdatedProductList({
        locationId,
        zoneId: zones,
        shopTypeId,
        products: products,
      });
      products = products.map(product => {
        if (product.multilingual) {
          const localName = product.multilingual.find(
            obj =>
              obj.language === language &&
              obj.attributeName === MultiLingualAttributes.NAME,
          );
          product.name = localName ? localName.value : product.name;
          const localDescription = product.multilingual.find(
            obj =>
              obj.language === language &&
              obj.attributeName === MultiLingualAttributes.DESCRIPTION,
          );
          product.description = localDescription
            ? localDescription.value
            : product.description;
        }
        // Incase there is no customerId we will set the expectedDeliveryDate to null
        product.expectedDeliveryDate = customerId && customer?.business_unit_id?.country_code
          ? getDeliveryDate(product.deliveryTime, customer.business_unit_id.country_code).deliveryDate
          : null;

        const { consumerPrice, taxExclusivePrice, tax } = getConsumerPriceForProduct(product);
        product.price = consumerPrice;
        product.volumeBasedPrices = getAdjustedVolumeBasedProductPrices(product);

        if(!product.taxInclusive && product.taxCategory === TAX_ON_PRICE) {
          product.price = +taxExclusivePrice;
          product.tax = +tax;
          product.volumeBasedPrices = product.volumeBasedPrices.map(vbp => ({
            ...vbp,
            price: +vbp.taxExclusivePrice,
            tax: +vbp.tax,
          }));
        }

        return toGetProductsResponse(product);
      });
      return { products, totalProducts };
    } catch (err) {
      sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
      throw err;
    }
  };

/**
 * This function gets products in a brand from the database, after attempting retrieval from Redis
 * @param {Number} brandId
 * @param {Number} page
 * @param {Number} perPage
 * @param {Number} customerId
 * @returns  {Array} products
 */
const getProductsByBrand =
  async (brandId, page = 1, perPage = 20, customerId = null, language = "EN", isJitEnabledForUser, clientTimeOffset,
    locationId, zones, shopTypeId) => {
    const logIdentifier = `API version: ${v1}, Context: ProductService.getProductsByBrand,`;
    sails.log(`${logIdentifier} called with params -> brandId: ${brandId}, page: ${page}, perPage: ${perPage}`);
    const products = await getProductsByFunnel(
      brandId, page, perPage, customerId, language, isJitEnabledForUser, clientTimeOffset,
      locationId, zones, shopTypeId,
    );
    return products;
  };

/**
 * This function gets products in a category from the database, after attempting retrieval from Redis
 * @param {Number} brandId
 * @param {Number} page
 * @param {Number} perPage
 * @param {Number} customerId
 * @returns  {Array} products
 */
const getProductsByCategory =
  async (
    categoryId, page = 1, perPage = 20, customerId = null, language = "EN", isJitEnabledForUser, clientTimeOffset,
    locationId, zones, shopTypeId,
  ) => {
    const logIdentifier = `API version: ${v1}, Context: ProductService.getProductsByCategory,`;
    sails.log(`${logIdentifier} called with params -> categoryId: ${categoryId}, page: ${page}, perPage: ${perPage}`);
    const products = await
    getProductsByFunnel(categoryId, page, perPage, customerId, language, isJitEnabledForUser, clientTimeOffset,
      locationId, zones, shopTypeId);
    return products;
  };

const clearAllAssociatedSortedsetsRedis = async productId => {
  const logIdentifier = `API version: ${v1}, Context: productService.clearAllAssociatedSortedsetsRedis(),`;
  sails.log(`${logIdentifier} called with -> ${productId}`);

  const productCategories = await findByProductId(productId);
  for (const productCategory of productCategories) {
    clearRedisEntity(`${FUNNEL_PRODUCTS_KEY}${productCategory.categoryId}`);
    clearRedisEntity(`${FUNNEL_JIT_PRODUCTS_KEY}${productCategory.categoryId}`);
  }
  return;
};

const clearProductFromRedis = async productId => {
  sails.log(
    `API version: ${v1}, Context: productService.clearProductFromRedis(),`,
    `clearing product -> ${PRODUCT_KEY}${productId}`,
  );
  return clearRedisEntity(`${PRODUCT_KEY}${productId}`);
};

const clearProductCategorySortedset = async categoryId => {
  sails.log(
    `API version: ${v1}, Context: productService.clearProductCategorySortedset(),`,
    `clearing product -> ${FUNNEL_PRODUCTS_KEY}${categoryId}`,
  );
  return clearRedisEntity(`${FUNNEL_PRODUCTS_KEY}${categoryId}`);
};

/**
 * This function takes the id, stockQuantity, stockIn and return updated product.
 *
 * @param {Number} id
 * @param {Number} stockQuantity
 * @param {Boolean} stockIn
 * @param returnPhysicalQty
 * @param connection
 * @returns {Object} product
 */
const updateProductInventory = async (id, stockQuantity, stockIn = false, returnPhysicalQty = 0, connection = null) => {
  const product = await productDao.findById(id);
  const updatedStockQuantity = stockIn ? product.stockQuantity + stockQuantity : product.stockQuantity - stockQuantity;
  let updatedProduct;
  if (process.env.ALLOW_INVENTORY_UPDATE_WMS === "true") {
    const updateObj = { stockQuantity: updatedStockQuantity, physicalStock: product.physicalStock + returnPhysicalQty };
    updatedProduct = await productDao.update(id, updateObj, connection);
  } else {
    updatedProduct = await productDao.update(id, { stockQuantity: updatedStockQuantity }, connection);
  }
  sails.log(`Update Product in Elastic Search: product id : ${id} stock ${updatedStockQuantity}`);
  await ProductService.updateProductInEs(id);
  return updatedProduct;
};

const updateProduct = async (id, quantity, stockIn = false, validate = true) => {
  // TODO Need to define a new constant key unable to use PRODUCT_KEY
  sails.log(`DEBUG: Update Product: ProductId: ${id}, Incoming Quantity: ${quantity}, Add Quantity: ${stockIn}`);
  const resource = `locks:products:${id}`;
  const lock = await locking(resource);
  const currentProduct = await productDao.findById(id);

  validate && validateProductStock(currentProduct, quantity);

  const stockQuantity = stockIn ? currentProduct.stockQuantity + quantity : currentProduct.stockQuantity - quantity;
  const product = await productDao.update(id, { stockQuantity });

  // Updating Elastic search
  sails.log(`Update Product in Elastic Search: product id: ${id} stock ${stockQuantity}`);
  await ProductService.updateProductInEs(id);
  sails.log(`Update Product : ${id}, Updated Stock : ${JSON.stringify(product.stockQuantity)}`);

  unLocking(lock).catch(error => sails.log.error(error));

  return { product, quantity };
};

/**
* This function takes search, locationId, page, perPage and returns products from elastic search
*
* @param {String} search
* @param {Number} locationId
* @param {Number} page
* @param {Number} perPage
* @returns {Array} products
*/
const searchProductsFromEs =
  async (esQuery, locationId, page, perPage, userId, language = "EN", isJitDisabledForUser = true, clientTimeOffset,
    zones, shopTypeId) => {
    const logIdentifier = `API version: ${v1}, Context: ProductService.searchProductsFromEs,`;

    sails.log(
      `${logIdentifier} called with params, query: ${esQuery}, locationId: ${locationId}, page: ${page},`,
      `perPage: ${perPage}, userId: ${userId}, language: ${language}`,
    );

    const queryArry = esQuery.trim().split(" ");
    let query = "";
    for (qp of queryArry) {
      query += "\"" + qp + "\"";
      if (queryArry.indexOf(qp) < queryArry.length - 1) {
        query += " AND ";
      }
    }

    sails.log(`${logIdentifier} ES query -> ${query}`);
    /*
          TODO:
          Using legacy service, need to bring it to v1
          */
    const esResponseObj =
      await ProductService.searchFromEs(
        query,
        locationId,
        page,
        perPage,
        isJitDisabledForUser,
      );
    const { success, message } = esResponseObj;
    if (!success) {
      sails.log.error(`${logIdentifier} Error: ES search service failed. ${esResponseObj.trace}`);
      throw Object.assign(new Error(`Elastic search service failed params: ${message}`));
    }
    const { response: { results, meta: { page: { total_results } } } } = esResponseObj;
    sails.log(
      `${logIdentifier} ES response -> success: ${success},`,
      `results: ${JSON.stringify(results)},`,
      `totalResults: ${total_results}`,
    );
    if (success) {
      // Incase there is a customerId we will fetch the country_code to calculate the expected delivery date
      if (locationId) {
        location = await findLocation(locationId);
        location.businessUnitId = await getBusinessUnitById(location.businessUnitId);
      }

      const key = language.toLowerCase() + "_name";

      sails.log(
        `${logIdentifier} called with params, query: ${esQuery}, locationId: ${locationId},`,
        `page: ${page}, perPage: ${perPage}, userId: ${userId}, language key: ${key}`,
      );
      let products = results.map(product => {
        let foundProduct = product;
        foundProduct.name = Object.prototype.hasOwnProperty.call(foundProduct, key)
          ? foundProduct[key]
          : foundProduct.name;
        foundProduct = toESProductFields(camelcaseKeys(foundProduct), location.businessUnitId.country_code);
        return foundProduct;
      });

      // Funnel Injection | Pricing Engine | Dynamic Pricing
      products = await pricingEngineService.getUpdatedProductList({
        locationId,
        zoneId: zones,
        shopTypeId,
        products: products,
      });

      products = products.map(product => {
        const foundProduct = product;
        const { consumerPrice, taxExclusivePrice, tax } = getConsumerPriceForProduct(foundProduct);
        foundProduct.price = consumerPrice;
        foundProduct.volumeBasedPrices = getAdjustedVolumeBasedProductPrices(foundProduct);

        if(!foundProduct.taxInclusive && foundProduct.taxCategory === TAX_ON_PRICE) {
          foundProduct.price = +taxExclusivePrice;
          foundProduct.tax = +tax;
          foundProduct.volumeBasedPrices = foundProduct.volumeBasedPrices.map(vbp => ({
            ...vbp,
            price: +vbp.taxExclusivePrice,
            tax: +vbp.tax,
          }));
        }

        return foundProduct;
      });

      products = await getUpdatedProductStock(userId, products, clientTimeOffset);
      sails.log(`${logIdentifier} products after mapping and tax and price calculation -> ${JSON.stringify(products)}`);
      return { products, totalProducts: total_results };
    }


    sails.log.error(`${logIdentifier} Error: search service responded with failure -> ${JSON.stringify(ESResponse)}`);
    throw Object.assign(new Error(`Elastic search service responded with failure: ${JSON.stringify(ESResponse)}`));
  };

/**
 *
 * @param {Number} customerId
 * @returns customer purchased categories
 */
const getPurchasedCategories = async customerId => {
  const queryForPurchasedCategories = `select distinct ot.product_id as productId, c.name as categoryName
    from orders o join order_items ot on o.id = ot.order_id
    join product_categories_junction pcj on ot.product_id = pcj.product_id join categories c
    on pcj.category_id = c.id where o.customer_id = $1 and c.parent_id is not null`;

  const queryForPurchasedCategoriesResult = await sails.sendNativeQuery(
    queryForPurchasedCategories,
    [customerId],
  );
  // removing duplicate category names
  return [
    ...new Set(
      queryForPurchasedCategoriesResult.rows.map(res => res.categoryName),
    ),
  ];
};

const sendProductLanguageMail = async (errorSkus, userData) => {
  // let html = "";
  if (errorSkus.length > 0) {
    html = "<h2>PRODUCT LANGUAGE UPDATED FAILED</h2>";
    html += "<p>" + "The language could not be updated for these SKUs: " + errorSkus + "</p>";
  } else {
    html = "<h2>PRODUCT LANGUAGE UPDATED SUCCESSFULLY</h2>";
  }
  const user = await populateHierarchyAccess(userData);
  const recipients = await getAccountEmails(user);
  if (_.isEmpty(userData.email)) recipients.push(userData.email);
  // sendMailThroughAmazon({
  //   email: recipients,
  //   htmlpart: html,
  //   subject: "PRODUCT LANGUAGE UPDATED REPORT - " + new Date(),
  // });
};

const bulkUpdateLanguages = async (fileName, locationId, userData) => {
  const logIdentifier = `API version: ${v1}, Context: ProductService.bulkUpdateLanguages(),`;
  const errorSkus = [];
  const updateSkus = [];
  const createSkus = [];
  let productIds = [];
  const dataArray = [];
  const stream = createReadStream(fileName);
  stream.on("data", async dataChunk => { // Get data in chunks instead of all at once
    dataArray.push(dataChunk);
  });

  stream.on("end", async () => {
    const workbook = xlsx.read(Buffer.concat(dataArray));
    const sheetList = workbook.SheetNames;
    const languageData = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetList[0]], // Get first sheet only
    );
    const allSkus = languageData.map(product => product.sku);
    const products = await productDao.findByCriteria({ sku: allSkus, locationId });
    for (const data of languageData) {
      const { sku, attribute } = data;
      if (!sku) {
        continue;
      }
      const product = products.find(item => item.sku === sku);
      if (_.isEmpty(product)) {
        errorSkus.push(sku);
        continue;
      }
      for (const [key] of Object.entries(data)) {
        if (data[key]) {
          if (Object.values(LANGUAGE).find(language => language === key)) {
            const criteria = { productId: product.id, language: key, attributeName: attribute };
            if (product.multilingual.find(language => language.language === key)) {
              updateSkus.push(ProductMultilingualAttributeDao.update(criteria, { value: data[key] }));
            } else {
              createSkus.push({ ...criteria, value: data[key] });
            }
            productIds.push(product.id);
          }
        }
      }
    }
    if (!_.isEmpty(updateSkus)) await Promise.all(updateSkus);
    if (!_.isEmpty(createSkus)) await ProductMultilingualAttributeDao.bulkCreate(createSkus);
    productIds = [...new Set(productIds)];
    for (const productId of productIds) {
      await ProductService.updateProductInEs(productId);
    }
    sails.log(`${logIdentifier} Error Skus -> ${errorSkus}`);
    sendProductLanguageMail(errorSkus, userData);  // send mail code is commented inside this function
  });
};

const findOneWithPopulate = async (criteria, subCriteria) => {
  const logIdentifier = `API version: ${v1}, Context: ProductService.findOneWithPopulate,`;
  sails.log(
    `${logIdentifier} called with criteria: ${JSON.stringify(
      criteria,
    )} and sub-criteria: ${JSON.stringify(subCriteria)}`,
  );
  return await productDao.findOneWithPopulate(criteria, subCriteria);
};
const likeProducts = async ({ customerId, productId, isLiked, isToolTip }) => {
  const logIdentifier = `API version: ${v1}, Context: ProductService.likeProducts(),`;
  sails.log(`${logIdentifier} called: ${JSON.stringify({ customerId, productId, isLiked, isToolTip })}`);
  if (isToolTip === false) {
    await customerExtractionService.update({ id: customerId }, { isToolTip });
    // await updateProfile(customerId, { isToolTip });
  }
  if (isLiked) {
    return await createLikeProduct({ customerId, productId });
  }
  return await unLikeProduct({ customerId, productId });
};

const mappingLocalizeOnProducts = async (products, customerId, language = "EN", locationId, zones, shopTypeId) => {
  // Incase there is a customerId we will fetch the country_code to calculate the expected delivery date
  // Funnel Injection | Pricing Engine | Dynamic Pricing
  const updatedProducts = await pricingEngineService.getUpdatedProductList({
    locationId,
    zoneId: zones,
    shopTypeId,
    products: products,
  });
  if (customerId) {
    customer = await customerExtractionService.findOne({ id: customerId });
    if (customer?.business_unit_id) {
      customer.business_unit_id = await findOneBusinessUnit({ id: customer.business_unit_id });
    }
  }
  const localizedProducts = updatedProducts.map(product => {
    if (product.multilingual) {
      const localName = product.multilingual.find(
        obj =>
          obj.language === language &&
          obj.attributeName === MultiLingualAttributes.NAME,
      );
      product.name = localName ? localName.value : product.name;
      const localDescription = product.multilingual.find(
        obj =>
          obj.language === language &&
          obj.attributeName === MultiLingualAttributes.DESCRIPTION,
      );
      product.description = localDescription
        ? localDescription.value
        : product.description;
      // Incase there is no customerId we will set the expectedDeliveryDate to null
      product.expectedDeliveryDate = customerId && customer?.business_unit_id?.country_code
        ? getDeliveryDate(product.deliveryTime, customer.business_unit_id.country_code).deliveryDate
        : null;
    }

    const { consumerPrice, taxExclusivePrice, tax } = getConsumerPriceForProduct(product);
    product.price = consumerPrice;
    product.volumeBasedPrices = getAdjustedVolumeBasedProductPrices(product);

    if(!product.taxInclusive && product.taxCategory === TAX_ON_PRICE) {
      product.price = +taxExclusivePrice;
      product.tax = +tax;
      product.volumeBasedPrices = product.volumeBasedPrices.map(vbp => ({
        ...vbp,
        price: +vbp.taxExclusivePrice,
        tax: +vbp.tax,
      }));
    }

    return toGetProductsResponse(product);
  });
  return localizedProducts;
};

const getProductsLiked =
  async (customerId, locationId, page, perPage, language = "EN", isJitEnabledForUser = false, clientTimeOffset,
    zones, shopTypeId) => {
    const logIdentifier = `API version: ${v1}, Context: ProductService.getProductsLiked(),`;
    sails.log(`${logIdentifier} called: ${customerId}, page: ${page}, perPage: ${perPage}`);

    const { skip, limit } = getPagination(+page, +perPage);
    try {
      const productIds = await getLikeProductIds({ customerId });
      if (!_.isEmpty(productIds)) {
        const ids = productIds.map(prod => (prod.productId));
        let products;
        if (isJitEnabledForUser) {
          products = await productDao.findEnabledProductsByLocationAndIds(ids, locationId);
        } else {
          products = await productDao.findNonJitEnabledProductsByLocationAndIds(ids, locationId);
        }
        const totalProducts = products.length;
        products = products.slice(skip, page * limit);
        products = products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        products = await mappingLocalizeOnProducts(products, customerId, language, locationId, zones, shopTypeId);
        products = await getUpdatedProductStock(customerId, products, clientTimeOffset);
        return { products, totalProducts };
      }

      sails.log.error(`${logIdentifier}, No Like Products!`);
      throw FUNNEL_PRODUCTS_NOT_FOUND();
    } catch (error) {
      sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
      throw error;
    }
  };

const productsWithLikeTag = (productList, { value: likedProducts }) => {
  if (_.isEmpty(likedProducts)) {
    return productList;
  }
  const { products, totalProducts } = productList;
  const mergedProductsWithLiked = products.map(product => {
    const isLiked = likedProducts.find(o => o.productId === product.id);
    if (isLiked) {
      product.isLiked = true;
      return product;
    }
    return product;
  });
  return { products: mergedProductsWithLiked, totalProducts };
};

const previousOrderedProducts =
  async (customerId, locationId, page, perPage, language = "EN", isJitEnabledForUser = false, clientTimeOffset,
    zones, shopTypeId) => {
    const logIdentifier = `API version: ${v1}, Context: ProductService.previousOrderedProducts(),`;
    sails.log(`${logIdentifier} called: ${customerId}, page: ${page}, perPage: ${perPage}`);

    const { skip, limit } = getPagination(+page, +perPage);
    try {
      const orders = await findOrders({ customerId }, 0, 20, "id DESC");
      const orderIds = orders.map(order => order.id);
      /**
           * Need to call OrderItem from Dao but facing a circular dependence issue, So calling the model function
           * here. It will be resolve in tech debt.
           */
      const orderProductIds = await OrderItems.find({ where: { order_id: orderIds }, select: ["product_id"] });
      const totalCount = countUniqueProduct(orderProductIds);
      const productIds = sortProperties(totalCount);

      if (!_.isEmpty(productIds)) {
        let products;
        if (isJitEnabledForUser) {
          products = await productDao.findEnabledProductsByLocationAndIds(productIds, locationId);
        } else {
          products = await productDao.findNonJitEnabledProductsByLocationAndIds(productIds, locationId);
        }
        products = sortProducts(products, productIds);
        const totalProducts = products.length;
        products = products.slice(skip, page * limit);
        products = await mappingLocalizeOnProducts(products, customerId, language, locationId, zones, shopTypeId);
        products = await getUpdatedProductStock(customerId, products, clientTimeOffset);
        const likedProducts = await getLikeProductIds({ customerId });
        products = { products, totalProducts };
        products = productsWithLikeTag(products, { value: likedProducts });
        return products;
      }
      sails.log.error(`${logIdentifier}, No Previous Ordered Products!`);
      throw FUNNEL_PRODUCTS_NOT_FOUND();
    } catch (error) {
      sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
      throw error;
    }
  };

const allPreviousOrderedProducts =
  async (customerId, locationId, page, perPage, language = "EN", isJitEnabledForUser = false, clientTimeOffset,
    zones, shopTypeId) => {
    const logIdentifier = `API version: ${v1}, Context: ProductService.allPreviousOrderedProducts(),`;
    const { skip, limit } = getPagination(+page, +perPage);
    try {
      const query = `SELECT orders.id FROM orders where orders.customer_id = ${customerId}`;
      const result = await sails.sendNativeQuery(query);
      const orders = result.rows;
      const orderIds = orders.map(order => order.id);

      const orderProductIds = await OrderItems.find({ where: { order_id: orderIds }, select: ["product_id"] });
      const totalCount = countUniqueProduct(orderProductIds);
      const productIds = sortProperties(totalCount);

      if (!_.isEmpty(productIds)) {
        let products;
        if (isJitEnabledForUser) {
          products = await productDao.findEnabledProductsByLocationAndIds(productIds, locationId);
        } else {
          products = await productDao.findNonJitEnabledProductsByLocationAndIds(productIds, locationId);
        }
        products = removedOutofStockProducts(products);
        products = sortProducts(products, productIds);
        const totalProducts = products.length;
        products = products.slice(skip, page * limit);
        products = await mappingLocalizeOnProducts(products, customerId, language, locationId, zones, shopTypeId);
        products = await getUpdatedProductStock(customerId, products, clientTimeOffset);
        const likedProducts = await getLikeProductIds({ customerId });
        products = { products, totalProducts };
        products = productsWithLikeTag(products, { value: likedProducts });
        return products;
      }
      sails.log.error(`${logIdentifier}, No Previous Ordered Products!`);
      throw FUNNEL_PRODUCTS_NOT_FOUND();
    } catch (error) {
      sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
      throw error;
    }
  };


const recommendedProduct =
  async (customerId, locationId, page, perPage, language = "EN", isJitEnabledForUser = false, clientTimeOffset,
    zones, shopTypeId) => {
    const logIdentifier = `API version: ${v1}, Context: ProductService.recommendedProduct(),`;
    sails.log(`${logIdentifier} called: ${customerId}, page: ${page}, perPage: ${perPage}`);

    const { skip, limit } = getPagination(+page, +perPage);
    try {
      const productIds = await productDao.recommendedProductsByCustomer(customerId);
      let products;
      if (isJitEnabledForUser) {
        products = await productDao.findEnabledProductsByLocationAndIds(productIds, locationId);
      } else {
        products = await productDao.findNonJitEnabledProductsByLocationAndIds(productIds, locationId);
      }
      products = removedOutofStockProducts(products);
      if (_.isEmpty(products)) {
        if (isJitEnabledForUser) {
          products = await productDao.findEnabledProductsByLocation(locationId);
        } else {
          products = await productDao.findNonJitEnabledProductsByLocation(locationId);
        }
        sails.log(`${logIdentifier} findEnabledProductsByLocation, ProductsFound ${JSON.stringify(products)}`);
        products = removedOutofStockProducts(products);
      }
      const totalProducts = products.length;

      /**
     * Set Products limit from ENV
     */
      if (sails.config.globalConf.RECOMMENDED_PRODUCT_LIMIT) {
        products = products.slice(0, 1 * sails.config.globalConf.RECOMMENDED_PRODUCT_LIMIT);
      }
      products = products.slice(skip, page * limit);
      products = await mappingLocalizeOnProducts(products, customerId, language, locationId, zones, shopTypeId);
      products = await getUpdatedProductStock(customerId, products, clientTimeOffset);
      const likedProducts = await getLikeProductIds({ customerId });
      if (_.isEmpty(products) && +page === 1) {
        throw FUNNEL_PRODUCTS_NOT_FOUND();
      }
      products = { products, totalProducts };
      products = productsWithLikeTag(products, { value: likedProducts });
      return products;
    } catch (error) {
      sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
      throw error;
    }
  };

/**
 * This function takes the productIds and returns productLanguages.
 *
 * @param {Object} productIds
 * @returns {Object} productLanguages
 */
const findProductNameLanguagesAR = async productIds => await ProductMultilingualAttributeDao
  .findAll({ productId: productIds, language: "AR", attributeName: "NAME" });

const upsertRecommendedProduct = async (customerId, productIds) => {
  const logIdentifier = `API version: ${v1}, Context: ProductService.upsertRecommendedProduct(),`;
  sails.log(`${logIdentifier} called: ${customerId}, productIds: ${productIds}`);
  try {
    const response = await productDao.createOrUpdateRecommendedProduct(customerId, productIds);
    return response;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

const upsertGenericProduct = async (locationId, productIds) => {
  const logIdentifier = `API version: ${v1}, Context: ProductService.upsertGenericProduct(),`;
  sails.log(`${logIdentifier} called: ${locationId}, productIds: ${productIds}`);
  try {
    const response = await productDao.createOrUpdateGenericProduct(locationId, productIds);
    return response;
  } catch (error) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(error.stack || error)}`);
    throw error;
  }
};

/**
 * This function takes the id and return product id.
 *
 * @param {Number} id
 * @returns {Object} product id
 */
const findProductIdById = async id => toProductIdDto(await findById(id));

/**
 * This function takes the criteria and return products.
 *
 * @param {Number} criteria
 * @returns {Object} products
 */
const findProducts = async criteria => await productDao.findByCriteria(criteria);

/**
 * This function takes the criteria and return VolumeBasedProductPrices.
 *
 * @param {Object} criteria
 * @returns {Object} VolumeBasedProductPrices
 */
const findVolumeBasedProductPrices = criteria => volumeBasedProductPriceDao.findByCriteria(criteria);

/**
 * This function takes the array of VolumeBasedProductPrice object and return new VolumeBasedProductPrice
 *
 * @param {Array} VolumeBasedProductPrices -> array of VolumeBasedProductPrice objects
 * @returns {Object} VolumeBasedProductPrice
 */
const createVolumeBasedProductPrices = volumeBasedProductPrices => {
  validateVolumeBasedProducts(volumeBasedProductPrices);
  return volumeBasedProductPriceDao.createEach(volumeBasedProductPrices);
};


/**
 * This function takes the array of VolumeBasedProductPrice object and return updated VolumeBasedProductPrice
 *
 * @param {Array} VolumeBasedProductPrices -> array of VolumeBasedProductPrice objects
 * @returns {Object} VolumeBasedProductPrice
 */
const updateVolumeBasedProductPrices = volumeBasedProductPrices => {
  validateVolumeBasedProducts(volumeBasedProductPrices);
  return volumeBasedProductPrices.map(volumeBasedProductPrice =>
    volumeBasedProductPriceDao.update(
      volumeBasedProductPrice.id,
      volumeBasedProductPrice,
    ),
  );
};

/**
 * This function takes the array of VolumeBasedProductPrice object and return updated VolumeBasedProductPrice
 *
 * @param {Number} productId
 * @returns {Object} VolumeBasedProductPrice
 */
const deleteVolumeBasedProductPrices = async productId => await volumeBasedProductPriceDao.
  deleteByProductId(productId);

const getVolumeBasedPriceInfo = (product, volumeBasedPriceDetails = {}, isBatchFlow = false) => {
  let volumeBasedPriceInfo = {};
  const { selectedTier } = volumeBasedPriceDetails;


  if (isBatchFlow) {
    volumeBasedPriceInfo = {
      actualUnitPrice: product.basePrice,
      volumeBasedPrice: parseFloat(product.price) + parseFloat(product.tax),
    };
  } else {
    if (product.isVolumeBasedPriceEnabled && !product.dynamicPriceHistoryId) {
      product.volumeBasedPrices.sort((a, b) => a.quantityFrom - b.quantityFrom);

      const firstTierIndex = 0;
      const selectedTierIndex = selectedTier - 1;

      // all prices are tax inclusive unless specified
      const taxExclusiveBasePrice = parseFloat(product.volumeBasedPrices[firstTierIndex]?.taxExclusivePrice);
      const taxOnBasePrice = parseFloat(product.volumeBasedPrices[firstTierIndex]?.tax);

      volumeBasedPriceInfo = {
        taxExclusiveBasePrice,
        taxOnBasePrice,
      };
      const taxInclusivePriceVal = product.volumeBasedPrices[selectedTierIndex]?.taxExclusivePrice;

      if (taxInclusivePriceVal) {
        const taxVal = product.volumeBasedPrices[selectedTierIndex]?.tax;
        const taxExclusiveVolumeBasedPrice = parseFloat(taxInclusivePriceVal);
        const taxOnVolumeBasedPrice = parseFloat(taxVal);
        const actualUnitPrice =  taxExclusiveBasePrice + taxOnBasePrice;
        const volumeBasedPrice = taxExclusiveVolumeBasedPrice + taxOnVolumeBasedPrice;
        const volumeBasedDiscount = actualUnitPrice - volumeBasedPrice;

        volumeBasedPriceInfo = {
          ...volumeBasedPriceInfo,
          actualUnitPrice,
          volumeBasedPrice,
          volumeBasedDiscount,
          taxOnVolumeBasedPrice,
          taxExclusiveVolumeBasedPrice,
        };
      }
    }
  }

  return volumeBasedPriceInfo;
};

/**
 * This function return the product object along with the
 * tax and price property inside based on the type of
 * product and tax category.
 *
 * @param {Object} product
 * @param {number} quantity
 * @returns {Object} product
 */
const populatePriceAndTaxByCategory = (productDetails, quantity) => {
  const product = { ...productDetails };
  const { price, tax, volumeBasedPriceDetails = {} } = calculateTaxAndPriceByCategory(product, quantity);
  product.price = parseFloat(price);
  product.tax = parseFloat(tax);

  product.volumeBasedPrices = volumeBasedPriceDetails.volumeBasedPrices;
  product.isVolumeBasedPriceCalculated =
    product.isVolumeBasedPriceEnabled &&
    volumeBasedPriceDetails.volumeBasedPrice > 0;
  product.volumeBasedPriceInfo = getVolumeBasedPriceInfo(
    product,
    volumeBasedPriceDetails,
  );
  product.actualUnitPrice = product.volumeBasedPriceInfo?.actualUnitPrice;
  return product;
};


const updateDynamicPricingFlag = async (productId, dynamicPricingFlag) => {
  sails.log(`DEBUG: Update Product: ProductId: ${productId}, Incoming Dynamic Pricing Flag: ${dynamicPricingFlag}`);
  await productDao.update(productId, { is_dynamic_price_enabled: dynamicPricingFlag });
  // Updating Elastic search
  sails.log(`Update Product in Elastic Search: product id: ${productId} Dynamic Pricing Flag ${dynamicPricingFlag}`);
  await ProductService.updateProductInEs(productId);
};

const updateBulkProductStock = async products => {
  for (const product of products) {
    await updateProduct(product.id, product.quantity);
  }
};

module.exports = {
  populatePriceAndTaxByCategory,
  findProductById,
  findProductsBySkus,
  getProductsByCategory,
  getProductsByBrand,
  clearAllAssociatedSortedsetsRedis,
  clearProductFromRedis,
  clearProductCategorySortedset,
  updateProductInventory,
  updateProduct,
  searchProductsFromEs,
  getPurchasedCategories,
  bulkUpdateLanguages,
  findOneWithPopulate,
  likeProducts,
  getProductsLiked,
  productsWithLikeTag,
  previousOrderedProducts,
  allPreviousOrderedProducts,
  recommendedProduct,
  findProductNameLanguagesAR,
  upsertRecommendedProduct,
  upsertGenericProduct,
  findProductIdById,
  findProducts,
  findVolumeBasedProductPrices,
  createVolumeBasedProductPrices,
  updateVolumeBasedProductPrices,
  deleteVolumeBasedProductPrices,
  getVolumeBasedPriceInfo,
  updateDynamicPricingFlag,
  updateBulkProductStock,
  findProductByIds,
};

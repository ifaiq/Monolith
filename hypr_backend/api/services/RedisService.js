const { promisify } = require("util");
var redis = require("ioredis");

const { redisEnv } = require('../../config/globalConf');

const env = redisEnv;

const ttl = 60 * 60; // 1 hour

let client;

if (process.env.REDIS_SERVER) {
  client = redis.createClient({ host: process.env.REDIS_SERVER });
} else {
  client = redis.createClient();
}

const lock = promisify(require("redis-lock")(client));

// Do not change these values
const FILTER_NAMES = {
  getAllCategories: env + ":getAllCategories",
  getProductByCategory: env + ":getProductByCategory",
  getOrdersByCustomerReference: env + ":getOrdersByCustomerReference",
  getPackerOrders: env + ":getPackerOrders",
  getPackerOrdersForStore: env + ":getPackerOrdersForStore",
  getOrdersBySalesAgent: env + ":getOrdersBySalesAgent",
  // user
  token: env + ":token",
  // customer retailer shop details
  customerShopDetails: env + ":customerShopDetails",
  // customer/user roles
  roles: env + ":roles",
  customerAdress: env + ":customerAdress",
  // locations for a company Array
  companyLocations: env + ":companyLocations",
  // location data
  location: env + ":location",
  // Categories for location Array
  locationCategories: env + ":locationCategories",
  // All categories for location Array
  locationCategoriesAll: env + ":locationCategoriesAll",
  // All brands for location Array
  locationBrandsAll: env + ":locationBrandAll",
  // Category data with enabled subCategories
  category: env + ":category",
  // Category data with enabled & disabled subCategories
  categoryAll: env + ":categoryAll",
  // Products for location array
  locationProducts: env + ":locationProducts",
  // Products for category array
  categoryProducts: env + ":categoryProducts",
  // All Products for category array
  categoryProductsAll: env + ":categoryProductsAll",
  // Product data
  product: env + ":product",
  // for token pool (logout users session based)
  getTokens: env + ":tokens",
};

const flushKeys = async (pattern, clearAll) => {
  if (clearAll) {
    // RedisService.client.flushall();
    // console.log(" KEYS FLUSH ALL");
    // let test = await RedisService.client.keys("*");
    // console.log(test);
    pattern = `${env}*`;
  } else if (pattern) {
    pattern = `${pattern}`;
    if (!pattern.startsWith(env)) {
      pattern = `${env}*` + pattern;
    }
  }
  let keys = await RedisService.client.keys(pattern);
  console.log("FLUSHING KEYS");
  console.log(keys);
  keys.map((e) => {
    RedisService.client.del(e);
  });
  return true;
};

const getProducts = async (reqID, category_id, skip, limit, showDisabled = false) => {
  return new Promise(async (resolve, reject) => {
    sails.log.info(`reqID: ${reqID}, context: RedisService.getProducts, Skip: ${skip} Limit: ${limit}`);
    try {
      let cacheProducts = [];
      let productIDsQuery = '';
      if (showDisabled == true) {
        sails.log(`context: RedisService.getProducts, In showDisabled block: '${showDisabled}'`);
        productIDsQuery = `${RedisService.FILTER_NAMES.categoryProductsAll}_*category_id:${category_id}_*`;
      } else {
        productIDsQuery = `${RedisService.FILTER_NAMES.categoryProducts}_*category_id:${category_id}_*`;
      }
      sails.log(
        `reqID: ${reqID}, context: RedisService.getProducts, productIDsQuery: "${productIDsQuery}"`
      );
      let productIDs = await RedisService.client.zrange(productIDsQuery, skip, limit - 1);
      let count = await RedisService.client.zcount(productIDsQuery, '-inf', '+inf');
      sails.log(
        `reqID: ${reqID}, context: RedisService.getProducts, productIDs: ${productIDs}`
      );
      let pipe = RedisService.client.pipeline();
      // getting data for all products
      for (let i = 0; i < productIDs.length; i++) {
        let productQuery = `${RedisService.FILTER_NAMES.product}_*product_id:${productIDs[i]}_*`;
        sails.log(
          `reqID: ${reqID}, context: RedisService.getProducts, productQuery: "${productQuery}"`
        );
        pipe.get(productQuery);
      }
      let productsData = await pipe.exec();
      for (let i = 0; i < productsData.length; i++) {
        try {
          if (productsData[i][1] == null) break;
          let data = JSON.parse(productsData[i][1]);
          sails.log(
            `reqID: ${reqID}, context: RedisService.getProducts, Index: ${i}, product data -> ${JSON.stringify(data)}`
          );
          cacheProducts.push(data);
        } catch (err) {
          sails.log.warn(
            `reqID: ${reqID}, context: RedisService.getProducts, Failed to parse data ${JSON.stringify(
              err.stack
            )}`
          );
        }
      }
      if (cacheProducts.length == productIDs.length) {
        sails.log(
          `reqID: ${reqID}, context: RedisService.getProducts, productIDs ${productIDs.length}, cacheProducts ${cacheProducts.length}`
        );
        products = cacheProducts;
        resolve({ products: products, count });
      } else {
        resolve({ products: [], count: 0 });
      }
    } catch (err) {
      sails.log.error(
        `reqID: ${reqID}, context: RedisService.getProducts, Error: ${JSON.stringify(err.stack)}`
      );
      resolve({ products: [], count: 0 });
    }
  });
};

const getProductById = async (reqID, productId) => {
  return new Promise(async (resolve, reject) => {
    try {
      sails.log.info(`reqID: ${reqID}, context: RedisService.getProducts, In RedisService.getProductById`);
      let productQuery = `${RedisService.FILTER_NAMES.product}_*product_id:${productId}_*`;
      let product = await RedisService.client.get(productQuery);
      resolve(product);
    }
    catch (err) {
      sails.log.error(
        `reqID: ${reqID}, context: RedisService.getProductById, Error: ${JSON.stringify(err.stack)}`
      );
      reject(err);
    }
  });
};

const setProducts = (reqID, dbProducts, setAllCategoryProducts = false) => {
  return new Promise((resolve, reject) => {
    try {
      let pipe = RedisService.client.pipeline();
      dbProducts.map((e) => {
        let categoryProductsQuery = '';
        if (setAllCategoryProducts == true) {
          categoryProductsQuery = `${RedisService.FILTER_NAMES.categoryProductsAll}_*category_id:${e.category_id}_*`;
        } else {
          categoryProductsQuery = `${RedisService.FILTER_NAMES.categoryProducts}_*category_id:${e.category_id}_*`;
        }
        sails.log(
          `reqID: ${reqID}, context: RedisService.setProducts, categoryProductsQuery: "${categoryProductsQuery}"`
        );
        let productQuery = `${RedisService.FILTER_NAMES.product}_*product_id:${e.id}_*`;
        sails.log(
          `reqID: ${reqID}, context: RedisService.setProducts, productQuery: "${productQuery}"`
        );
        RedisService.client.zadd(categoryProductsQuery, e.product_priority, e.id);
        pipe.set(productQuery, JSON.stringify(e));
      });
      pipe.exec();
      resolve();
    } catch (err) {
      sails.log.error(
        `reqID: ${reqID}, context: RedisService.setProducts, Error: ${JSON.stringify(err.stack)}`
      );
    }
  });
};

const getCategories = async (reqID, location_id, skip, limit, showDisabled = false, paginate = false, type = "CATEGORY") => {
  return new Promise(async (resolve, reject) => {
    try {
      sails.log.info(
        `reqID: ${reqID}, context: RedisService.getCategories locationID: ${location_id} Skip: ${skip} Limit: ${limit}`
      );
      sails.log.info(
        `reqID: ${reqID}, context: RedisService.getCategories showDisabled: ${showDisabled} paginate: ${paginate}`
      );
      let store = [];
      let count = 0;
      let pipe = RedisService.client.pipeline();
      let locationCategories;
      if (showDisabled) {
        // getting all categories
        let locationCategoriesQuery ;
        if(type === "BRAND"){
          locationCategoriesQuery = `${RedisService.FILTER_NAMES.locationBrandsAll}_*location_id:${location_id}_*`;
        } else {
          locationCategoriesQuery = `${RedisService.FILTER_NAMES.locationCategoriesAll}_*location_id:${location_id}_*`;
        }
        sails.log(
          `reqID: ${reqID}, context: RedisService.getCategories locationCategoriesQuery: ${locationCategoriesQuery}`
        );
        locationCategories = await RedisService.client.smembers(locationCategoriesQuery);
        count = locationCategories.length;
        // sort by priority
        locationCategories = locationCategories.sort(function (a, b) {
          return a - b;
        });
        // paginate
        if (paginate) {
          locationCategories = locationCategories.slice(skip, limit);
        }
        sails.log(
          `reqID: ${reqID}, context: RedisService.getCategories locationCategories All: ${JSON.stringify(
            locationCategories
          )} Total: ${count}`
        );
      } else {
        // getting enabled categories
        let locationCategoriesQuery = `${RedisService.FILTER_NAMES.locationCategories}_*location_id:${location_id}_*`;
        sails.log(
          `reqID: ${reqID}, context: RedisService.getCategories locationCategoriesQuery: ${locationCategoriesQuery}`
        );
        // paginate
        if (paginate) {
          pipe.zrange(locationCategoriesQuery, skip, limit - 1);
        } else {
          pipe.zrange(locationCategoriesQuery, 0, -1);
        }
        pipe.zcount(locationCategoriesQuery, '-inf', '+inf');
        locationCategories = await pipe.exec();
        count = parseInt(locationCategories[1][1]);
        locationCategories = locationCategories[0][1];
        sails.log(
          `reqID: ${reqID}, context: RedisService.getCategories locationCategories paginated: ${JSON.stringify(
            locationCategories
          )} Total: ${count}`
        );
      }
      pipe = RedisService.client.pipeline();
      // getting data for all categories for store
      for (let i = 0; i < locationCategories.length; i++) {
        let categoryQuery = showDisabled ?
          `${RedisService.FILTER_NAMES.categoryAll}_*category_id:${locationCategories[i]}_*` :
          `${RedisService.FILTER_NAMES.category}_*category_id:${locationCategories[i]}_*`;
        sails.log(
          `reqID: ${reqID}, context: RedisService.getCategories categoryQuery: ${categoryQuery}`
        );
        pipe.get(categoryQuery);
      }
      let locationCategoriesData = await pipe.exec();
      // parsing and compiling data for all categories and subcategories for location
      for (let i = 0; i < locationCategoriesData.length; i++) {
        sails.log(
          `reqID: ${reqID}, context: RedisService.getCategories Index: ${i} locationCategoriesData: ${JSON.stringify(
            locationCategoriesData[i][1]
          )}`
        );
        try {
          if (locationCategoriesData[i][1] == null) break;
          let data = JSON.parse(locationCategoriesData[i][1]);
          store.push(data);
        } catch (err) {
          sails.log.warn(
            `reqID: ${reqID}, context: RedisService.getCategories Failed to parse data ${JSON.stringify(
              err.stack
            )}`
          );
        }
      }
      if (locationCategories.length === store.length) {
        sails.log.info(
          `reqID: ${reqID}, context: RedisService.getCategories Redis Location Data paginated: ${store.length} Total: ${count}`
        );
        resolve({ store: store, count: count });
      } else {
        sails.log.info(
          `reqID: ${reqID}, context: RedisService.getCategories Incomplete or no categories data found in Redis for store: ${location_id} categories: ${locationCategories.length} Redis: ${store.length}`
        );
        resolve({ store: [], count: 0 });
      }
    } catch (err) {
      sails.log.info(
        `reqID: ${reqID}, context: RedisService.getCategories Error: ${JSON.stringify(err.stack)}`
      );
      resolve({ store: [], count: 0 });
    }
  });
}

const setCategories = (reqID, categories, location_id, setAllCategories = false, type = "CATEGORY") => {
  return new Promise((resolve, reject) => {
    try {
      if (categories.length > 0) {
        let pipe = RedisService.client.pipeline();
        let locationCategoriesQuery = `${RedisService.FILTER_NAMES.locationCategories}_*location_id:${location_id}_*`;
        sails.log(
          `reqID: ${reqID}, context: RedisService.setCategories locationCategoriesQuery: ${locationCategoriesQuery}`
        );
        if (setAllCategories) {
          if(type === "BRAND"){
            locationCategoriesQuery = `${RedisService.FILTER_NAMES.locationBrandsAll}_*location_id:${location_id}_*`;
          } else {
            locationCategoriesQuery = `${RedisService.FILTER_NAMES.locationCategoriesAll}_*location_id:${location_id}_*`;
          }
          sails.log(
            `reqID: ${reqID}, context: RedisService.getCategories locationCategoriesQuery: ${locationCategoriesQuery}`
          );
        }
        for (let i = 0; i < categories.length; i++) {
          let storeCategoryContentQuery = setAllCategories ?
            `${RedisService.FILTER_NAMES.categoryAll}_*category_id:${categories[i].id}_*` :
            `${RedisService.FILTER_NAMES.category}_*category_id:${categories[i].id}_*`;
          sails.log(
            `reqID: ${reqID}, context: RedisService.setCategories storeCategoryContentQuery ${storeCategoryContentQuery}`
          );
          pipe.set(storeCategoryContentQuery, JSON.stringify(categories[i]));
          if (setAllCategories) {
            pipe.sadd(locationCategoriesQuery, categories[i].id);
          } else {
            pipe.zadd(locationCategoriesQuery, categories[i].priority, categories[i].id);
          }
        }
        pipe.exec();
        resolve();
      } else {
        resolve();
      }
    } catch (err) {
      sails.log.error(
        `reqID: ${reqID}, context: RedisService.setCategories Error: ${JSON.stringify(err.stack)}`
      );
      resolve();
    }
  });
}

const getLocations = async (reqID, company_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let locationsData = [];
      let companyLocationsQuery = `${RedisService.FILTER_NAMES.companyLocations}_*company_id:${company_id}_*`;
      sails.log.info(
        `reqID: ${reqID}, context: LocationService.getLocations, locations: ${JSON.stringify(
          companyLocationsQuery
        )}`
      );
      companyLocations = await RedisService.client.smembers(
        companyLocationsQuery
      );
      sails.log(
        `reqID: ${reqID}, context: RedisService.getLocations, company locations: ${JSON.stringify(
          companyLocations.length
        )}`
      );
      let pipe = RedisService.client.pipeline();
      for (let i = 0; i < companyLocations.length; i++) {
        let locationsQuery = `${RedisService.FILTER_NAMES.location}_*location_id:${companyLocations[i]}_*`;
        sails.log(
          `reqID: ${reqID}, context: RedisService.getLocations, locationsQuery: ${locationsQuery}`
        );
        pipe.get(locationsQuery);
      }
      let locationsCachedData = await pipe.exec();
      sails.log(
        `reqID: ${reqID}, context: RedisService.getLocations, locationsCachedData: ${JSON.stringify(
          locationsCachedData
        )}`
      );
      for (let i = 0; i < locationsCachedData.length; i++) {
        try {
          let locationContent = JSON.parse(locationsCachedData[i][1]);
          locationsData.push(locationContent);
        } catch (err) {
          sails.log.warn(
            `reqID: ${reqID}, context: RedisService.getLocations, Error parsing Redis locationData: ${JSON.stringify(
              err.stack
            )}`
          );
        }
      }
      if (locationsData.length === companyLocations.length) {
        sails.log.info(
          `reqID: ${reqID}, context: RedisService.getLocations, locations: ${locationsData.length}`
        );
        resolve({ locations: locationsData, count: locationsData.length });
      } else {
        sails.log.info(
          `reqID: ${reqID}, context: RedisService.getLocations, Incomplete or no data in Redis`
        );
        resolve({ locations: [], count: 0 });
      }
    } catch (err) {
      sails.log.info(
        `reqID: ${reqID}, context: RedisService.getLocations, Error: ${JSON.stringify(err.stack)}`
      );
      resolve({ locations: [], count: 0 });
    }
  });
}

const setLocations = (reqID, locationsData, company_id) => {
  return new Promise((resolve, reject) => {
    try {
      if (locationsData.length > 0) {
        let companyLocations = [];
        let pipe = RedisService.client.pipeline();
        sails.log.info(
          `reqID: ${reqID}, context: RedisService.setLocations locations: ${locationsData.length}`
        );
        if (locationsData.length > 0) {
          for (let i = 0; i < locationsData.length; i++) {
            companyLocations.push(locationsData[i].location_id);
            let locationQuery = `${RedisService.FILTER_NAMES.location}_*location_id:${locationsData[i].location_id}_*`;
            sails.log(
              `reqID: ${reqID}, context: RedisService.setLocations locationQuery: ${locationQuery}`
            );
            pipe.set(locationQuery, JSON.stringify(locationsData[i]));
          }
        }
        let companyLocationsQuery = `${RedisService.FILTER_NAMES.companyLocations}_*company_id:${company_id}_*`;
        sails.log(
          `reqID: ${reqID}, context: RedisService.setLocations companyLocationsQuery: ${companyLocationsQuery}`
        );
        pipe.sadd(companyLocationsQuery, companyLocations);
        pipe.exec();
        resolve();
      } else {
        resolve();
      }
    } catch (err) {
      sails.log.error(
        `reqID: ${reqID}, context: RedisService.setLocations Error: ${JSON.stringify(err.stack)}`
      );
      resolve();
    }
  });
}

module.exports = {
  client,
  FILTER_NAMES,
  ttl,
  flushKeys,
  getProducts,
  getProductById,
  setProducts,
  setCategories,
  getCategories,
  setLocations,
  getLocations,
  lock,
};

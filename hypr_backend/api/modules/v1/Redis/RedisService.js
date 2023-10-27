const redis = require("redis");
const { promisify } = require("util");
const Redlock = require("redlock");
const { redisEnv, redisServer } = require("./Constant");
const { getPaginationForRedis } = require("../../../../utils/services");
const { constants: { request: { VERSIONING: { v1 } } } } = require("../../../constants/http");
const camelcaseKeys = require("camelcase-keys");
const { constants: { product: PRODUCT_REDIS_KEY } } = require("./Constant");
const { CategoryTypes } = require("../../../constants/enums/index");


const client = redis.createClient({ host: redisServer, prefix: redisEnv });
const destinationClient = redis.createClient({ host: process.env.DESTINATION_REDIS_SERVER, prefix: redisEnv });

client.on("error", error => sails.log.error(error));

const hgetAsync = promisify(client.hget).bind(client);
const hsetAsync = promisify(client.hset).bind(client);
const hsetAsyncDestination = promisify(destinationClient.hset).bind(destinationClient);

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);
const msetAsync = promisify(client.mset).bind(client);

const zaddAsync = promisify(client.zadd).bind(client);

const redlock = new Redlock(
  [client],
  {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200, // time in ms
    retryJitter: 200, // time in ms
  },
);

/**
 * Gets paginated entities from a sortedset with their total number
 * @param {String} sortedSetKey
 * @param {Number} page
 * @param {Number} perPage
 * @returns {Array} zrange and zcount response
 */
const multiAsyncGetSortedSet = (sortedSetKey, page, perPage) => new Promise((resolve, reject) => {
  const logIdentifier = `API version: ${v1}, Context: redisService.multiAsyncGetSortedSet(),`;
  sails.log(`${logIdentifier} multiAsyncSortedSets called with -> ${sortedSetKey}, ${page}, ${perPage}`);
  const { redisSkip: skip, redisLimit: limit } = getPaginationForRedis(+page, +perPage);
  client.multi()
    .zrange(sortedSetKey, skip, limit)
    .zcount(sortedSetKey, "-inf", "+inf")
    .exec((err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
});

const multiAsyncGetSortedSetWithScores = (sortedSetKey, page, perPage) => new Promise((resolve, reject) => {
  const logIdentifier = `API version: ${v1}, Context: redisService.multiAsyncGetSortedSet(),`;
  sails.log(`${logIdentifier} multiAsyncSortedSets called with -> ${sortedSetKey}, ${page}, ${perPage}`);
  const { redisSkip: skip, redisLimit: limit } = getPaginationForRedis(+page, +perPage);
  client.multi()
    .zrange(sortedSetKey, skip, limit, "withscores")
    .zcount(sortedSetKey, "-inf", "+inf")
    .exec((err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
});

const separateIdsFromPrioritiesDict = entityIdsWithScore => {
  const entityIds = entityIdsWithScore.filter((element, index, array) => (index % 2 === 0));
  const mappedEntityPriorities = entityIdsWithScore.reduce((responseObject, product, index, array) => {
    if (index & 1) {
      responseObject[array[index - 1]] = product;
    }
    return responseObject;
  }, {});
  return [entityIds, mappedEntityPriorities];
};

/**
 * Gets values for an array of keys
 * @param {Array} keys
 * @returns {Array} values
 */
const multiAsyncGet = keys => new Promise((resolve, reject) => {
  const logIdentifier = `API version: ${v1}, Context: redisService.multiAsyncGet(),`;
  sails.log(`${logIdentifier} multiAsyncGet called with params -> ${keys}`);
  const multiClient = client.multi();
  for (const key of keys) {
    multiClient.get(key);
  }
  multiClient.exec((err, response) => {
    if (err) {
      reject(err);
    } else {
      sails.log(`${logIdentifier} multiAsyncGet response -> ${response}`);
      resolve(response);
    }
  });
});

/**
 * Sets mulitple key value pairs
 * @param {String} type of entities to set, e.g. categories
 * @param {Array} entity objects with their ids to be set as keys
 * @returns {String} response from redis set command
 */
const setMultipleEntities = async (type, entities) => {
  const logIdentifier = `API version: ${v1}, Context: redisService.setMultipleEntities(),`;
  sails.log.info(`${logIdentifier} Entry`);
  sails.log(`${logIdentifier} called with -> ${type}, ${JSON.stringify(entities)}`);
  const msetArr = [];
  for (const entity of entities) {
    msetArr.push(`${type}${entity.id}`, JSON.stringify(entity));
  }
  const msetResponse = await msetAsync(msetArr);
  sails.log(`${logIdentifier} mset response -> ${msetResponse}`);
  sails.log.info(`${logIdentifier} Exit`);
  return msetResponse;
};

/**
 * Adds an array of categoryIds with scores to a sorted set
 * @param {String} key for this set
 * @param {Array} entityObjects
 * @param {String} key  of entity on which it would be scored
 * @returns zadd's response
 */
const createSortedSet = async (key, entities, scoreOn) => {
  const logIdentifier = `API version: ${v1}, Context: redisService.createSortedSet()`;
  sails.log.info(`${logIdentifier}, Entry`);
  sails.log(
    `${logIdentifier}, called with params -> key: ${key}, entities: ${JSON.stringify(
      entities,
    )}, scoreOn: ${scoreOn}`,
  );
  const keysWithScores = [key];
  let stockPriority = 1;
  for (const entity of entities) {
    if (entity[scoreOn] !== null) {
      keysWithScores.push(stockPriority, entity.id);
      stockPriority++;
    } else {
      keysWithScores.push("+inf", entity.id);
    }
  }

  const zaddResponse = await zaddAsync(keysWithScores);
  sails.log(`${logIdentifier} zadd response -> ${zaddResponse}`);
  sails.log.info(`${logIdentifier} Exit`);
  return zaddResponse;
};


/**
 * Adds an array of categoryIds with scores to a sorted set, only intended for the use of categories
 * @param {String} key for this set
 * @param {Array} entityObjects
 * @param {String} key  of entity on which it would be scored
 * @returns zadd's response
 */
const createSortedSetV2 = async (key, entities, scoreOn) => {
  const logIdentifier = `API version: ${v1}, Context: redisService.createSortedSet()`;
  sails.log.info(`${logIdentifier}, Entry`);
  sails.log(
    `${logIdentifier}, called with params -> key: ${key}, entities: ${JSON.stringify(
      entities,
    )}, scoreOn: ${scoreOn}`,
  );
  const keysWithScores = [key];
  let stockPriority = 1;
  for (const entity of entities) {
    if (entity[scoreOn] !== null) {
      keysWithScores.push(stockPriority, JSON.stringify(entity));
      stockPriority++;
    } else {
      keysWithScores.push("+inf", JSON.stringify(entity));
    }
  }

  const zaddResponse = await zaddAsync(keysWithScores);
  sails.log(`${logIdentifier} zadd response -> ${zaddResponse}`);
  sails.log.info(`${logIdentifier} Exit`);
  return zaddResponse;
};

const getSortedEntitiesByParent = async (parentKey, childKeyPrefix, page, perPage) => {
  const logIdentifier = `API version: ${v1}, Context: redisService.getSortedEntitiesByParent(),`;
  sails.log.info(`${logIdentifier} Entry`);
  sails.log(
    `${logIdentifier} called with params -> parentKey: ${parentKey}, 
    childKeyPrefix: ${childKeyPrefix}, page: ${page}, perPage: ${perPage}`,
  );
  const [entities, total] = await multiAsyncGetSortedSet(parentKey, page, perPage);
  if (total !== 0) {
    const parsedEntities = entities.map(e => camelcaseKeys(JSON.parse(e)));
    return ({ entities: parsedEntities, total });
  }

  sails.log.info(`${logIdentifier}, Exit`);
  return ({ entities: [], total });
};

const clearRedisEntity = key => delAsync(key);

const locking = async (resource, ttl = 1000) => await redlock.lock(resource, ttl);

const unLocking = async lock => await lock.unlock();

const clearProductCache = async data => {
  sails.log.info(`Clearing redis data: ${JSON.stringify(data.productId)}`);
  const productRedisKey = `:${PRODUCT_REDIS_KEY}_*product_id:${data.productId}_*`;
  const productQuery = `${RedisService.FILTER_NAMES.product}_*product_id:${data.productId}_*`;
  await delAsync(productRedisKey);
  return Promise.all([
    RedisService.client.del(productQuery),
  ]);
};

const clearCategoryCache = async data => {
  let categoryQuery = `${RedisService.FILTER_NAMES.category}_*category_id:${data.id}_*`;
  const locationCategoriesQuery = `${RedisService.FILTER_NAMES.locationCategories}_*location_id:${data.location_id}_*`;
  let locationCategoriesAllQuery;
  if (data.type === CategoryTypes.BRAND) {
    locationCategoriesAllQuery = `${RedisService.FILTER_NAMES.locationBrandsAll}_*location_id:${data.location_id}_*`;
  } else {
    locationCategoriesAllQuery =
      `${RedisService.FILTER_NAMES.locationCategoriesAll}_*location_id:${data.location_id}_*`;
  }

  if (data.parent) {
    categoryQuery = `${RedisService.FILTER_NAMES.category}_*category_id:${data.parent}_*`;
    const categoryAllQuery = `${RedisService.FILTER_NAMES.categoryAll}_*category_id:${data.parent}_*`;
    return Promise.all([
      RedisService.client.del(locationCategoriesQuery),
      RedisService.client.del(locationCategoriesAllQuery),
      RedisService.client.del(categoryQuery),
      RedisService.client.del(categoryAllQuery),
    ]);
  }
  return Promise.all([
    RedisService.client.del(locationCategoriesQuery),
    RedisService.client.del(locationCategoriesAllQuery),
    RedisService.client.del(categoryQuery),
  ]);
};

module.exports = {
  hgetAsync,
  hsetAsync,
  hsetAsyncDestination,
  getAsync,
  setAsync,
  delAsync,
  setMultipleEntities,
  multiAsyncGetSortedSet,
  multiAsyncGetSortedSetWithScores,
  multiAsyncGet,
  createSortedSet,
  getSortedEntitiesByParent,
  clearRedisEntity,
  separateIdsFromPrioritiesDict,
  locking,
  unLocking,
  clearProductCache,
  clearCategoryCache,
  createSortedSetV2,
};

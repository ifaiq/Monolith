const redis = require("ioredis");
const moment = require("moment");
const redisClient = redis.createClient({ host: process.env.REDIS_SERVER || 'localhost' });

// TODO: make these attributes dynamic in case we want to implement rate limiting on more apis
const WINDOW_SIZE_IN_SEC = 60; // 1 min
const MAX_WINDOW_REQUEST_COUNT = 15; // 15 requests
const EXPIRE_REDIS_KEYS = 60; // 1 min
const redisGenericKey = `retailo-backend-${process.env.NODE_ENV}-`;

module.exports = async function(req, res, next) {
    const { username } = req.body;
    try {
      if (!redisClient) {
        throw new Error('Redis client does not exist!');
      }
      // Getting Redis for value against phone
      redisClient.get(`${redisGenericKey}${username}`, (err, record) => {
        if (err) throw err;
        const currentRequestTime = moment();
        console.log(`record found - ${JSON.stringify(record)}`);
        if (!record) {
          let newRecord = [];
          let requestLog = {
            username: username,
            requestTimeStamp: currentRequestTime.unix(),
            requestCount: 1
          };
          newRecord.push(requestLog);
          // Setting redis record against username with timestamp and count
          console.log(`data updated - ${JSON.stringify(newRecord)}`);
          redisClient.setex(`${redisGenericKey}${username}`, WINDOW_SIZE_IN_SEC, JSON.stringify(newRecord));
          return next();
        } else {
          const parsedRecord = JSON.parse(record);
          console.log("PARSED RECORD - ", parsedRecord);
          if (parsedRecord[0].requestCount === MAX_WINDOW_REQUEST_COUNT) {
            console.log("LIMIT REACHED - ", parsedRecord);
            if (!parsedRecord[0].blocked) {
              console.log(`Blocking mechanism active for user ${username} for ${EXPIRE_REDIS_KEYS} seconds!`)
              parsedRecord[0].blocked = true;
              redisClient.setex(`${redisGenericKey}${username}`, EXPIRE_REDIS_KEYS, JSON.stringify(parsedRecord));
            }
            return res.badRequest(`You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_SEC} seconds limit, Blocked for ${EXPIRE_REDIS_KEYS} seconds!`);
          }
        }
        let data = JSON.parse(record); 
        // Going back 60 seconds to check if any requests exists
        let windowStartTimestamp = moment()
          .subtract(WINDOW_SIZE_IN_SEC, 'seconds')
          .unix();
        let requestsWithinWindow = data.filter((entry) => {
          return entry.requestTimeStamp > windowStartTimestamp;
        });
        console.log(`Request within ${WINDOW_SIZE_IN_SEC} seconds window - ${JSON.stringify(requestsWithinWindow)}`)
        let totalWindowRequestsCount = requestsWithinWindow.reduce((accumulator, entry) => {
          return accumulator + entry.requestCount;
        }, 0);
        console.log(`Total no of requests in last ${WINDOW_SIZE_IN_SEC} seconds against username ${username} - ${totalWindowRequestsCount}`)
        // Send 429 if 15 requests were made in 60 seconds window
        if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
          console.log(`Blocking mechanism active for user ${username} for ${EXPIRE_REDIS_KEYS} seconds!`)
          redisClient.setex(`${redisGenericKey}${username}`, EXPIRE_REDIS_KEYS, JSON.stringify(data));
          return res.badRequest(`You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_SEC} seconds limit!`);
        } else {
          if (requestsWithinWindow.length) {
            console.log(`Same ${WINDOW_SIZE_IN_SEC} seconds time window continued ...`)
            // When the number of requests made are less than the maximum the a new entry is logged
            let lastRequestLog = data[data.length - 1];
            lastRequestLog.requestCount++;
            data[data.length - 1] = lastRequestLog;
            console.log(`data updated - ${JSON.stringify(data)}`);
            redisClient.setex(`${redisGenericKey}${username}`, WINDOW_SIZE_IN_SEC, JSON.stringify(data));
            next();
          } else {
            console.log(`${WINDOW_SIZE_IN_SEC} seconds time window refreshed!!`)
            let lastRequestLog = data[data.length - 1];
            lastRequestLog.requestTimeStamp = currentRequestTime.unix();
            lastRequestLog.requestCount = 1;
            data[data.length - 1] = lastRequestLog;
            console.log(`data updated - ${JSON.stringify(data)}`);
            redisClient.setex(`${redisGenericKey}${username}`, WINDOW_SIZE_IN_SEC, JSON.stringify(data));
            next();
          }
        }
      });
    } catch (error) {
      next(error);
    }
};

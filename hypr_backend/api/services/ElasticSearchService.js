/**
 * There are multiple resources to communicate with the Elastic app search cloud.
 * 1- REST full APIS.
 * 2- Node Client.
 *  */
const AppSearchClient = require("@elastic/app-search-node");
const axios = require("axios");
const axiosRetry = require('axios-retry');
const { httpCaller } = require('./HttpService');
const {
  constants: {
    routes: { ELASTIC_APP_SEARCH: { API, VERSION, ENGINES, SYNONYMS } },
    request: {
      RESOURSES: { GET, POST, PUT, DELETE },
      OPTIONS: { PAGE_SIZE, CURRENT_PAGE },
      HEADER: { CONTENT, CONTENT_TYPE_JSON, AUTH: { BEARER, AUTHORIZATION },
      } } },
} = require('../constants/http');
const packageJson = require('../../package.json');

const axiosClient = axios.create();

axiosRetry(axiosClient, {
  retries: 3,
  retryDelay: (retryCount) => {
      return retryCount * 1000;
  },
  retryCondition: () => true,
});

const { globalConf: { ELASTIC_APP_SEARCH_HOST, ELASTIC_APP_SEARCH_ENGINE, ELASTIC_APP_SEARCH_PRIVATE_KEY } } = sails.config;
const headers = {
  [`${AUTHORIZATION}`]: `${BEARER} ${ELASTIC_APP_SEARCH_PRIVATE_KEY || ''}`,
  [`${CONTENT}`]: CONTENT_TYPE_JSON,
};
const elastic_app_search_url = `${ELASTIC_APP_SEARCH_HOST}${API}${VERSION}${ENGINES}${ELASTIC_APP_SEARCH_ENGINE}${SYNONYMS}`;

// TODO Refactor ES node client 
const baseUrlFn = () => `${ELASTIC_APP_SEARCH_HOST}${API}${VERSION}`;
const client = new AppSearchClient(undefined, ELASTIC_APP_SEARCH_PRIVATE_KEY, baseUrlFn);



module.exports = {
  addData: (data) => {
    return client.indexDocuments(ELASTIC_APP_SEARCH_ENGINE, data);
  },

  searchData: async (query, options) => {
    const url = `${ELASTIC_APP_SEARCH_HOST}${API}${VERSION}engines/${encodeURIComponent(ELASTIC_APP_SEARCH_ENGINE)}/search`;

    const data = {
      ...options,
      query: query.slice(1, -1)
    };

    const response = await axiosClient({
      method: 'POST',
      url,
      data,
      headers: {
        'X-Swiftype-Client': 'elastic-app-search-node',
        'X-Swiftype-Client-Version': packageJson.version,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ELASTIC_APP_SEARCH_PRIVATE_KEY}`
      },
    });

    return response?.data;
  },
  deleteData:async (ids) => {
    return client.destroyDocuments(ELASTIC_APP_SEARCH_ENGINE, ids);
  },
  /**
   * 
   * @param {Number} size 
   * @param {Number} current 
   */
  getSynonyms: async (size = PAGE_SIZE, current = CURRENT_PAGE) =>
    await httpCaller({
      headers,
      method: GET,
      url: `${elastic_app_search_url}`
    }),
  /**
   * 
   * @param {String} id 
   */
  getSynonymsById: async id =>
   {   let response =  await httpCaller({
      headers,
      method: GET,
      url: `${elastic_app_search_url}${id}`
    })
    return response.data;
  },
  /**
   * 
   * @param {String[]} synonyms 
   */
  createSynonyms: async synonyms => {
    let response = await httpCaller({
      headers,
      method: POST,
      url: `${elastic_app_search_url}`,
      data: { synonyms }
    });
    return response.data;
  }
    ,
  /**
   * 
   * @param {String} id 
   * @param {String[]} synonyms 
   */
  updateSynonyms: async (id, synonyms) =>
    await httpCaller({
      headers,
      method: PUT,
      url: `${elastic_app_search_url}${id}`,
      data: { synonyms }
    }),
  /**
   * 
   * @param {String} id 
   */
  deleteSynonyms: async id =>
    await httpCaller({
      headers,
      method: DELETE,
      url: `${elastic_app_search_url}${id}`
    }),
};

const axios = require('axios');

module.exports = {
  get: async ({ url, params, headers }) => {
    try {
      const response = await axios.get(url, {
        headers,
        params,
      });
      return response.data;
    } catch(err) {
      throw err;
    }
  },
  post: async ({ url, data, params, headers }) => {
    try {
      const response = await axios.post(url, data, {
        headers,
        params,
      });
      return response.data;
    } catch(err) {
      throw err;
    }
  },
  put: async ({ url, data, params, headers }) => {
    try {
      const response = await axios.put(url, data, {
        headers,
        params,
      });
      return response.data;
    } catch(err) {
      throw err;
    }
  },
  patch: async ({ url, data, params, headers }) => {
    try {
      const response = await axios.patch(url, data, {
        headers,
        params,
      });
      return response.data;
    } catch(err) {
      throw err;
    }
  },
  delete: async ({ url, data, params, headers }) => {
    try {
      const response = await axios.delete(url, {
        headers,
        params,
        data,
      });
      return response.data;
    } catch(err) {
      throw err;
    }
  },
};

const Axios = require('axios');

const { constants: { request: { RESOURSES: { GET } } } } = require('../constants/http');

module.exports = {
    httpCaller: (
        {
            method = GET,
            url = '',
            data = {},
            params = {},
            headers = {},
        } = {},
    ) => Axios({
        method,
        url,
        params,
        data,
        headers,
        validateStatus: status => status >= 200 && status < 300,
    })
        .then(res => res)
        .catch(({ response }) => { throw (response); }),

}

Axios.interceptors.response.use(response => response, error => {
    return Promise.reject(error)
});
const axios = require('axios');
const { getS2sAuthToken } = require("../modules/v1/Utils/s2sAuthHelper");

const {
  constants: {
    routes: { SMS_SERVICE_INTEGRATION: { SEND_SMS } },
    request: {
      RESOURSES: { POST }
    },
  },
} = require('../constants/http');

module.exports = {

  /**
  * Responsible to send sms through sms service
  * @param sessionId
  * @param product
  * @returns {Promise<unknown>}
  */
  sendSms: async (params) => {

    sails.log.info('SmsRestClient.sendSms is invoked');
    let url = `${sails.config.globalConf.SMS_SERVICE_HOST}/${SEND_SMS}`;

    const logIdentifier = `SMS SERVICE CALL: ${url} -`
    sails.log(`${logIdentifier} send sms through sms service with params -> ${JSON.stringify(params)}`);

    const token = await getS2sAuthToken();
    return new Promise((resolve, reject) => {
      axios.request({
        url: url,
        method: POST,
        headers: { AUTHORIZATION: token },
        data: params
      })
        .then((response) => {
          sails.log.info(`SmsRestClient.sendSms received response - ${JSON.stringify(response.data)}`);
          resolve(response.data);
        })
        .catch((error) => {
          sails.log.error(`SmsRestClient.sendSms failed to send sms. Details: ${JSON.stringify(error.data)}`);
          reject(error)
        });
    });
  },
};

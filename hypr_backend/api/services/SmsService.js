const requestify = require("requestify");
const AWSService = require("./AWSService");
const AWS = AWSService.getAWSConfig();
const sqs = new AWS.SQS();
const sns = new AWS.SNS();
const SmsRestClient = require("../clients/SmsRestClient");
const businessUnitExtractionService = require("../config_service_extraction/businessUnitExtraction");

let HyprEoceanOptions = {
  api_base:
    "https://pk.eocean.us/APIManagement/API/RequestAPI?response=string&user=hyp&pwd=APvtTAidAhpm2m4ewhsHlg9ULndwmdHSQZ7Jrss%2b3IeMQ9ziyiFgA3ZMpU%2fswxotgg%3d%3d&sender=HYPR&",
  param_mapping: {
    send_to: "reciever",
    data: "msg-data",
  },
};
let HyprTwilioOptions = {
  accountSid: "AC6e6ae8dfcc832f08099060d3213d2e73",
  authToken: "9b677ff30223a589affd092338541b5a",
  from: "+12017620261",
};

const { AWS_SQS_HOST, AWS_ACCOUNT_ID, EOCEAN_SMS_SQS_NAME, EOCEAN_SMS_FORWARDER } = require('../../config/globalConf');
const queueUrl = `${AWS_SQS_HOST}${AWS_ACCOUNT_ID}/${EOCEAN_SMS_SQS_NAME}`;

module.exports = {
  sendClientMessage: function (options, message_info) {
    sails.log.debug(
      `SmsService.sendClientMessage Options: ${JSON.stringify(
        options
      )} Info: ${JSON.stringify(message_info)}`
    );
    if (process.env.NODE_ENV != "local") {
      let send_to = options.send_to;
      return new Promise(async function (resolve, reject) {
        try {
          // TODO: refactor this flow properly
          // fetch country code for sms service
          let buId;
          let countryCode = null;
          if (options.business_unit_id) {
            buId = options.business_unit_id;
            if (typeof options.business_unit_id != "number")
              buId = options.business_unit_id.id;
            const businessUnit = await businessUnitExtractionService.findOne({
              id: buId,
            });
            countryCode = businessUnit.country_code;
          }

          sails.log.info(
              `SmsService.sendClientMessage Sending client api message Options: ${JSON.stringify(options)}`
          );
          let result = await SmsRestClient.sendSms({
            recepient: send_to,
            message_info: message_info,
            country_code: countryCode ? countryCode : 'AWS' // TODO: add this to constants
          })
          resolve(result);          
        } catch (err) {
          sails.log.info(`SmsService.sendClientMessage Error: ${JSON.stringify(err.stack)}`);
          resolve(null);
        }
      });
    } else {
      sails.log.info("SmsService.sendClientMessage Running from local environment. SMS not sent. Returning null");
      return null;
    }
  },
  sendHyprMessage: async function (send_to, message_info) {
    if (process.env.NODE_ENV != "local") {
      if (send_to[0] == "9" && send_to[1] == "2") {
        HyprEoceanOptions.send_to = send_to;
        return SmsService.sendAPIMessage(HyprEoceanOptions, message_info);
      } else {
        HyprTwilioOptions.send_to = send_to;
        return SmsService.sendTwilioMessage(HyprTwilioOptions, message_info);
      }
    } else {
      return null;
    }
  },

  sendAPIMessage: function (options, message_info, method = "GET") {
    let message =
      typeof message_info === "string" ? message_info : message_info.message;
    let args = typeof message_info === "object" ? message_info.args : [];

    if (args !== undefined && args.length > 0)
      message = SmsService.__(message, args);
    return new Promise(function (resolve, reject) {
      let api_url =
        options.api_base +
        options.param_mapping.send_to +
        "=" +
        options.send_to +
        "&" +
        options.param_mapping.data +
        "=" +
        encodeURIComponent(message);

      sails.log.info(`SmsService.sendClientMessage Sending client api message api_url: ${JSON.stringify(api_url)}`);
      if (method == "GET") {
        try {
          const params = {
            Message: message /* required */,
            PhoneNumber: options.send_to, //PHONE_NUMBER, in the E.164 phone number structure
          };
          sails.log.info(`SmsService.sendClientMessage sending SNS sms with params ${JSON.stringify(params)}`);
          const data = sns.publish(params, (err, response) => {
            if (err) {
              sails.log.error(`SmsService.sendClientMessage SNS error ${JSON.stringify(err)}`);
              return reject(err);
            }
            sails.log.info(`SmsService.sendClientMessage sent SNS sms ${JSON.stringify(response)}`);
            return resolve(response);
          });
        } catch (err) {
          sails.log.error(`SmsService.sendClientMessage SNS error ${JSON.stringify(err.stack)}`);
        }
        // let queueUrlHardCode = `https://sqs.me-south-1.amazonaws.com/718230964299/prod-eocean-sms-queue`
        // sails.log.info(`SmsService.sendClientMessage EOCEAN_SMS_FORWARDER ${EOCEAN_SMS_FORWARDER} and queueUrlHardCode ${queueUrlHardCode}`);
        //   const params = {
        //     MessageBody: JSON.stringify({
        //       sms_url: api_url,
        //     }),
        //     QueueUrl: queueUrlHardCode
        //   };
        //   sqs.sendMessage(params, (err, data) => {
        //     if (err) {
        //       sails.log.error(`SmsService.sendClientMessage Failed to add message to eocean sms queue Error: ${JSON.stringify(err)}`);
        //       reject(err);
        //     } else {
        //       sails.log.info(`SmsService.sendClientMessage Successfully added message to eocean sms queue messageID: ${data.MessageId} message: ${JSON.stringify(data)}`);
        //       resolve(true);
        //     }
        //   });
      } else {
        requestify
          .post(api_url)
          .then(function (response) {
            sails.log.info(`SmsService.sendClientMessage sendAPIMessage POST Response: ${JSON.stringify(response)}`);
            resolve(response);
          })
          .catch(function (error) {
            sails.log.error(`SmsService.sendClientMessage sendAPIMessage POST Error: ${JSON.stringify(error)}`);
            reject(error);
          });
      }
    });
  },
  sendHyprTwilioMessage: function (send_to, message_info) {
    HyprTwilioOptions.send_to = send_to;
    return SmsService.sendTwilioMessage(HyprTwilioOptions, message_info);
  },
  sendTwilioMessage: function (options, message_info) {
    console.log("OPTIONS FOR TWILIO MSG");
    console.log(options);
    const accountSid = options.accountSid;
    const authToken = options.authToken;
    const client = require("twilio")(accountSid, authToken);
    let message =
      typeof message_info === "string" ? message_info : message_info.message;
    let args = typeof message_info === "object" ? message_info.args : [];

    if (args !== undefined && args.length > 0)
      message = SmsService.__(message, args);
    return new Promise(function (resolve, reject) {
      client.messages
        .create({
          from: options.from,
          body: message,
          to: `+${options.send_to}`,
        })
        .then((message) => {
          resolve(true);
        })
        .catch((error) => {
          console.log(error);
          reject(null);
        });
    });
  },
  __: function (message, arr_args) {
    sails.log.debug(
      `SMSService function Message: ${JSON.stringify(
        message
      )} Args: ${JSON.stringify(arr_args)}`
    );
    var tmpMsg = message.replace(/%s/gi, "%%"); // to support sails standard locale args
    arr_args.forEach((arg) => {
      tmpMsg = tmpMsg.replace("%%", arg);
    });
    return tmpMsg;
  },
};

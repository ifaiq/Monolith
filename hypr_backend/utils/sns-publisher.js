const AWS = require("aws-sdk");
const keys = require("./keys");

const messagePublisher = new AWS.SNS({ region: keys.topic_region });
const publishMessage = (snsTopic, message) => {
  sails.log(
    `Context : SNS message publishing ----> ${JSON.stringify(message)}`
  );

  return messagePublisher
    .publish({
      TopicArn: snsTopic,
      Message: message,
    })
    .promise()
    .then((data) => {
      sails.log(
        `Context : SNS message published ----> ${JSON.stringify(data)}`
      );

      return data;
    })
    .catch((err) => {
      sails.log(
        `Context : SNS message publisher error ----> ${JSON.stringify(err)}`
      );
      throw new Error(err);
    });
};

module.exports = {
  publishMessage,
};

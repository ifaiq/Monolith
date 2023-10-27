const AWS = require("aws-sdk");
const { globalConf: { AWS_KEY, AWS_SECRET, AWS_REGION } } = require("../config/globalConf");
AWS.config.update({
	region: AWS_REGION,
	credentials: {
	  accessKeyId: AWS_KEY,
	  secretAccessKey: AWS_SECRET,
	},
  });
const sqs = new AWS.SQS();


const createMessage = (message, logIdentifier) => {
	sqs.sendMessage(message, (err, data) => {
		if (err) {
			sails.log.info(`${logIdentifier} Error while sending sqs message: ${JSON.stringify(err)}`);
		} else {
			sails.log.info(`${logIdentifier} Successfully added message messageID: ${data.MessageId} message: ${JSON.stringify(data)}`);
		}
	});
  };
  
  module.exports = {
    createMessage,
  };
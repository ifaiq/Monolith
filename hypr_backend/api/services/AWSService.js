const AWS = require("aws-sdk");
const { globalConf: { AWS_KEY, AWS_SECRET, AWS_BUCKET, AWS_REGION } } = require("../../config/globalConf");

/**
 * documentation for updating global AWS config:
 * https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/global-config-object.html
**/

AWS.config.update({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_KEY,
    secretAccessKey: AWS_SECRET,
  },
});

module.exports = {
    getAWSConfig: () => AWS,
    options: {
        key: AWS_KEY,
        secret: AWS_SECRET,
        bucket: AWS_BUCKET,
        region: AWS_REGION,
    },
}

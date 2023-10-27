const AWS = require("aws-sdk");
const { Consumer } = require("sqs-consumer");
const {
  globalConf: {
    AWS_REGION,
    AWS_KEY,
    AWS_SECRET,
    PRICING_ENGINE_SQS_NAME,
    AWS_ACCOUNT_ID,
    PRICING_ENGINE_RETRY_SQS_NAME,
  },
} = require("../../../../config/globalConf");
const productService = require("./ProductService");

AWS.config.update({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_KEY, secretAccessKey: AWS_SECRET },
});

const queueUrl = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}/${PRICING_ENGINE_SQS_NAME}`;
const retryQueueUrl = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}/${PRICING_ENGINE_RETRY_SQS_NAME}`;

const sqs = new AWS.SQS();

const app = Consumer.create({
  queueUrl: queueUrl,
  handleMessage: message => {
    sails.log.info(
      `Received a message to sync product dynamic pricing flag from pricing engine - ${message.Body}`,
    );
    const { productId, isDynamicPricingEnabled } = JSON.parse(message.Body);
    if (productId) {
      productService.updateDynamicPricingFlag(
        productId,
        isDynamicPricingEnabled,
      );
    }
  },
  sqs: sqs,
});

const retryQueue = Consumer.create({
  queueUrl: retryQueueUrl,
  handleMessage: message => {
    sails.log.info(
      `Received a message on retry queue to sync product dynamic pricing flag from pricing engine - ${message.Body}`,
    );
    const { productId, isDynamicPricingEnabled } = JSON.parse(message.Body);
    if (productId) {
      productService.updateDynamicPricingFlag(
        productId,
        isDynamicPricingEnabled,
      );
    }
  },
  sqs: sqs,
});

app.start();
retryQueue.start();

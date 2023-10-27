const { orderFeedbackService } = require("../../modules/v1/OrderFeedback");

const createFeedback = async (req, res, next) => {
  try {
    const {
      isSatisfied = null,
      orderId,
      notes = "",
      dismissed = false,
    } = req.body;

    const response = await orderFeedbackService.createFeedback({
      isSatisfied,
      orderId,
      customerId: req.userId,
      notes,
      dismissed,
    });

    res.ok(response);
  } catch (error) {
    sails.log.error(
      `OrderFeedbackController: ${JSON.stringify(error.stack || error)}`,
    );
    res.error(error);
  }
};

const getOrderFeedback = async (req, res, next) => {
  try {
    const { orderId = 0 } = req.query;

    const feedback = await orderFeedbackService.getOrderFeedback(orderId);

    if (!feedback) {
      const error = new Error(`Feedback not found`);
      error.statusCode = 404;
      throw error;
    }

    res.ok(feedback);
  } catch (error) {
    sails.log.error(
      `OrderFeedbackController: ${JSON.stringify(error.stack || error)}`,
    );
    res.error(error);
  }
};

const getCustomerFeedback = async (req, res, next) => {
  try {
    const { retailerId = 0, limit = 10, offset = 0 } = req.query;

    const feedbacks = await orderFeedbackService.getCustomerFeedback({
      retailerId,
      limit,
      offset,
    });

    res.ok(feedbacks);
  } catch (error) {
    sails.log.error(
      `OrderFeedbackController: ${JSON.stringify(error.stack || error)}`,
    );
    res.error(error);
  }
};

const getFeedbackMissingOrder = async (req, res, next) => {
  try {
    const result = await orderFeedbackService.getFeedbackMissingOrder(
      req.userId,
    );

    res.ok(result);
  } catch (error) {
    sails.log.error(
      `OrderFeedbackController: ${JSON.stringify(error.stack || error)}`,
    );
    res.error(error);
  }
};

module.exports = {
  createFeedback,
  getOrderFeedback,
  getCustomerFeedback,
  getFeedbackMissingOrder,
};

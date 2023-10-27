const orderFeedbackDao = require("./OrderFeedbackDao");
const { findbyCriteria: findOrderbyCriteria } = require("../Order/OrderDao");

const {
  ORDER_STATES: {
    PARTIAL_DELIVERED,
    DELIVERED,
    CANCELLED,
  },
} = require("../Order/Constants");

const {
  errors: {
    INVALID_ORDER_STATUS,
  },
} = require("../Order/Errors");


const createFeedback = async ({
  isSatisfied,
  orderId,
  customerId,
  notes,
  dismissed,
}) => {
  const [feedbackExist, orderDetails] = await Promise.all([
    getOrderFeedback(orderId),
    findOrderbyCriteria({ id: orderId }),
  ]);

  if (!_.isEmpty(feedbackExist)) {
    throw {
      message: "Feedback already given",
    };
  }

  if (![PARTIAL_DELIVERED, DELIVERED, CANCELLED].includes(orderDetails.statusId)) {
    throw INVALID_ORDER_STATUS();
  }

  return orderFeedbackDao.createFeedback({
    isSatisfied,
    orderId,
    customerId,
    notes,
    dismissed,
  });
};

const getOrderFeedback = orderId =>
  orderFeedbackDao.getOrderFeedback(orderId);

const getCustomerFeedback = criteria =>
  orderFeedbackDao.getCustomerFeedback(criteria);

const getFeedbackMissingOrder = customerId =>
  orderFeedbackDao.getFeedbackMissingOrder(customerId);

module.exports = {
  createFeedback,
  getOrderFeedback,
  getCustomerFeedback,
  getFeedbackMissingOrder,
};

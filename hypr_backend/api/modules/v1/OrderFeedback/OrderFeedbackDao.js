const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const { promisify } = require("util");
const { getOrderById } = require("../Order/OrderService");

const createFeedback = async data => camelcaseKeys(await OrderFeedback.create(snakecaseKeys(data)));

const getOrderFeedback = async (orderId = 0) =>
  camelcaseKeys(
    ...await OrderFeedback.find({
      where: {
        order_id: orderId,
      },
      limit: 1,
    }).sort("id DESC"),
  );

const getCustomerFeedback = async ({
  retailerId = 0,
  limit = 10,
  offset = 0,
}) =>
  camelcaseKeys(
    await OrderFeedback.find({
      where: { customer_id: retailerId },
      limit,
      skip: offset,
    }),
  );

const getFeedbackMissingOrder = async customerId => {
  const query = promisify(OrderFeedback.query);

  const result = await query(
    `SELECT
    id AS orderId 
  FROM
    orders 
  WHERE
    (customer_id = ${customerId} 
    AND ( status_id IN ( 8, 9, 10 ) AND DATE_ADD( updated_at, INTERVAL 86400 * 3 SECOND ) > NOW() )) 
    AND id NOT IN ( SELECT order_id FROM order_feedbacks WHERE customer_id = ${customerId} ) 
  ORDER BY
    id DESC 
    LIMIT 1;`,
  );

  if(!result.rows.length) {
    return null;
  }

  return getOrderById(result.rows[0].orderId);
};

module.exports = {
  createFeedback,
  getOrderFeedback,
  getCustomerFeedback,
  getFeedbackMissingOrder,
};

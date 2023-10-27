const { errors: { ORDER_NOT_FOUND } } = require("./Errors");
const camelcaseKeys = require("camelcase-keys");
const snakecaseKeys = require("snakecase-keys");
const { toOrderStatusesDto } = require("./OrderMapper");


/**
 * This function takes the id and return order.
 *
 * @param {Number} id
 * @returns {Object} order
 */
const findByCheckedId = async id => {
  const order = await Order.findOne({ id });
  if (_.isEmpty(order)) {
    throw ORDER_NOT_FOUND();
  }
  return camelcaseKeys(order);
};

/**
 * This function takes the id and return order.
 *
 * @param {Number} id
 * @returns {Object} order
 */
const find = async id => await findByCheckedId(id);

/**
 * This function takes the skip, limit and return orders.
 *
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Order[]} orders
 */
const findAll = async (criteria, skip, limit, sort = "id ASC") =>
  (
    await Order.find(snakecaseKeys(criteria)).sort(sort).skip(skip).limit(limit)
  ).map(camelcaseKeys);

/**
 * This function takes the criteria and return order count.
 *
 * @param {Object} criteria
 * @returns {Number} total orders
 */
const count = async criteria => await Order.count(criteria);

/**
 * This function takes the id, order and return updated order.
 *
 * @param {Number} id
 * @param {Object} order
 * @param {Object} connection - optional db connection for transaction
 * @returns {Object} order
 */
const update = async (id, order, connection = null) => {
  let updatePromise = Order.updateOne({ id }, snakecaseKeys(order));
  if (connection) {
    updatePromise = updatePromise.usingConnection(connection);
  }
  return await updatePromise;
};

/**
 * This function takes the order and return new order.
 *
 * @param {Object} order
 * @returns {Object} order
 */
const create = async order => camelcaseKeys(await Order.create(order));

/**
 * This function takes the id and return order with populated tables.
 *
 * @param {Number} id
 * @returns {Object} order
 */
const findByIdAndPopulateItems = async id => {
  const order = await Order.findOne({ id })
    .populate("order_items");

  if (_.isEmpty(order)) {
    throw ORDER_NOT_FOUND();
  }
  return camelcaseKeys(order, { deep: true });
};

/**
 * This function takes the criteria and return orders with populated tables.
 *
 * @param {Object} criteria
 * @returns {Array[]} orders
 */
const findbyCriteriaAndPopulateStatuses = async (criteria, skip, limit) => {
  const orders = await Order.find(snakecaseKeys(criteria, { deep: false }))
    .populate("status_id")
    .sort("id desc")
    .skip(skip)
    .limit(limit);
  return toOrderStatusesDto(camelcaseKeys(orders, { deep: true }));
};

/**
 * This function takes the criteria and return order.
 *
 * @param {Object} criteria
 * @returns {Object} order
 */
const findbyCriteria = async criteria => {
  const order = await Order.findOne(snakecaseKeys(criteria));
  if (_.isEmpty(order)) {
    throw ORDER_NOT_FOUND();
  }
  return camelcaseKeys(order);
};


/**
 * This function takes the criteria and return order with feedback.
 *
 * @param {Object} criteria
 * @returns {Object} order
 */
const findbyCriteriaAndPopulateFeedback = async criteria => {
  const order = await Order.findOne(snakecaseKeys(criteria)).populate("feedback");
  if (_.isEmpty(order)) {
    throw ORDER_NOT_FOUND();
  }
  return camelcaseKeys(order);
};

/**
 * This function takes the criteria and return first order with placed_at sort.
 *
 * @param {Object} criteria
 * @returns {Object} order
 */
const findLatestByCriteria = async criteria => {
  const order = await Order.find(snakecaseKeys(criteria)).limit(1).sort("placed_at desc");
  if (_.isEmpty(order)) {
    throw ORDER_NOT_FOUND();
  }
  return camelcaseKeys(order);
};
/**
 * This function takes the criteria and deletes one order if it matches that criteria
 * @param {Object} criteria
 * @returns {Object} deleted order
 */
const hardDeleteOne = async criteria => await Order.destroyOne(snakecaseKeys(criteria));

const findLast24HrOrderIds = async criteria => {
  const { customer_id, start, end } = criteria;
  const orders = await sails.getDatastore("readReplica").
    sendNativeQuery(
      `select id from orders where customer_id = $1 and status_id <> 10 and created_at BETWEEN $2 and $3 limit 100`,
      [customer_id, start, end],
    );
  return orders.rows;
};
const getCategoriesDgmvByCustomerId = async (customerIds, categoryIds, startTime, endTime) => {
  const query = `SELECT 
  ca.id,
  SUM(CASE
      WHEN
          o.status_id IN (8 , 9)
      THEN
          (oi.price + CASE
              WHEN oi.adjusted_tax IS NULL THEN oi.tax
              ELSE oi.adjusted_tax
          END) * oi.quantity
      ELSE 0
  END) AS dgmv
FROM
  orders o
      LEFT JOIN
  order_items oi ON o.id = oi.order_id
      LEFT JOIN
  product_categories_junction pcj ON pcj.product_id = oi.product_id
      LEFT JOIN
  categories ca ON pcj.category_id = ca.id
      AND ca.parent_id IS NULL
WHERE
  ca.id IN ($1)
      AND o.placed_at BETWEEN FROM_UNIXTIME($2) AND FROM_UNIXTIME($3)
      AND o.customer_id IN ($4)
GROUP BY 1`;

  const result = await sails.getDatastore("readReplica")
    .sendNativeQuery(query, [categoryIds, startTime / 1000, endTime / 1000, customerIds]);
  return result.rows;
};

const getGrowthMetrics = async (customerIds, startTime, endTime, selectedMetrics) => {
  const selectedAttributes = [];

  if (selectedMetrics.includes("gmv")) {
    selectedAttributes.push(`
      SUM((oi.price + CASE
        WHEN oi.adjusted_tax IS NULL THEN oi.tax
        ELSE oi.adjusted_tax
      END) * oi.original_quantity) AS gmv
    `);
  }

  if (selectedMetrics.includes("dgmv")) {
    selectedAttributes.push(`
      SUM(CASE
        WHEN
          o.status_id IN (8 , 9)
        THEN
          (oi.price + CASE
            WHEN oi.adjusted_tax IS NULL THEN oi.tax
            ELSE oi.adjusted_tax
          END) * oi.quantity
        ELSE 0
      END) AS dgmv
    `);
  }

  if (selectedMetrics.includes("ogmv")) {
    selectedAttributes.push(`
      SUM(CASE
        WHEN
          o.sales_agent_id IS NULL
        THEN
          (oi.price + CASE
            WHEN oi.adjusted_tax IS NULL THEN oi.tax
            ELSE oi.adjusted_tax
          END) * oi.original_quantity
        ELSE 0
      END) AS ogmv
    `);
  }

  if (selectedMetrics.includes("odgmv")) {
    selectedAttributes.push(`
     SUM(CASE
        WHEN
          o.sales_agent_id IS NULL AND
          o.status_id IN (8 , 9)
        THEN
          (oi.price + CASE
            WHEN oi.adjusted_tax IS NULL THEN oi.tax
            ELSE oi.adjusted_tax
          END) * oi.original_quantity
        ELSE 0
      END) AS odgmv
    `);
  }

  if (selectedMetrics.includes("totalcount")) {
    selectedAttributes.push(`
      COUNT(DISTINCT o.id) AS totalCount
    `);
  }

  if (selectedMetrics.includes("totalorganicorders")) {
    selectedAttributes.push(`
      COUNT(DISTINCT CASE
        WHEN o.sales_agent_id IS NULL THEN o.id
        ELSE NULL
      END) AS totalOrganicOrders
    `);
  }

  if (selectedMetrics.includes("totaldeliveredorders")) {
    selectedAttributes.push(`
      COUNT(DISTINCT CASE
        WHEN o.status_id IN (8 , 9) THEN o.id
        ELSE NULL
      END) AS totaldeliveredorders
    `);
  }

  if (selectedMetrics.includes("spo")) {
    selectedAttributes.push(`
      COUNT(DISTINCT oi.product_id)/COUNT(DISTINCT o.id) AS spo
    `);
  }

  if (selectedMetrics.includes("spr")) {
    selectedAttributes.push(`
      COUNT(DISTINCT oi.product_id)/COUNT(DISTINCT o.customer_id) AS spr
    `);
  }

  const query = `
    SELECT
      ${selectedAttributes.join()}
    FROM
      orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE
      o.customer_id IN ($1) 
      AND
      (o.delivered_time BETWEEN FROM_UNIXTIME($2) AND FROM_UNIXTIME($3) 
      OR
      o.placed_at BETWEEN FROM_UNIXTIME($2) AND FROM_UNIXTIME($3))
  `;

  const result = await sails.getDatastore("readReplica")
    .sendNativeQuery(query, [customerIds, startTime / 1000, endTime / 1000]);

  return result.rows;
};

module.exports = {
  findAll,
  create,
  update,
  count,
  find,
  findByIdAndPopulateItems,
  findbyCriteriaAndPopulateStatuses,
  findbyCriteria,
  hardDeleteOne,
  findLatestByCriteria,
  findLast24HrOrderIds,
  getGrowthMetrics,
  getCategoriesDgmvByCustomerId,
  findbyCriteriaAndPopulateFeedback,
};

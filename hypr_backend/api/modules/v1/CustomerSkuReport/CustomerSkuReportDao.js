const camelcaseKeys = require("camelcase-keys");

/**
 * It creates a new report user sku.
 * @param {object} data
 */
const create = async data => await CustomerSkuReport.create(data);

const upsertMany = async data => {
  const promises = [];
  data.forEach(datum => {
    promises.push(CustomerSkuReport.updateOrCreate(datum));
  });
  await Promise.all(promises);
};

const findAll = async (skip, limit) => camelcaseKeys((await sails
  .sendNativeQuery(`SELECT *
    FROM customer_sku_report 
    WHERE deleted_at IS NULL 
    GROUP BY file_name
    ORDER BY id DESC 
    LIMIT $1 OFFSET $2`, [limit, skip])).rows);

const getCount = async () => await sails.sendNativeQuery(`SELECT COUNT(DISTINCT file_name) as total
FROM customer_sku_report 
WHERE deleted_at IS NULL`);

module.exports = {
  create,
  upsertMany,
  findAll,
  getCount,
};

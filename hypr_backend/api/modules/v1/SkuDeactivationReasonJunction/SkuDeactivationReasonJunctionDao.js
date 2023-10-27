/**
 * It creates a new SkuDeactivationReasonJunction record in the database
 */
const create = async data => await SkuDeactivationReasonJunction.create(data);

/**
 * It finds the latest record in the database that matches the criteria
 */
const findLatest = async criteria =>
  await SkuDeactivationReasonJunction.find(criteria)
    .sort("created_at DESC")
    .limit(1);

module.exports = {
  create,
  findLatest,
};

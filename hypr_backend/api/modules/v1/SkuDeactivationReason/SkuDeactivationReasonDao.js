/**
 * It creates a new sku deactivation reason.
 * @param data - The data to be create
 */
const create = async data => await SkuDeactivationReason.create(data);

/**
 * It updates a single sku deactivation reason in the database
 * @param id - The id of the sku deactivation reason you want to update
 * @param data - The data to be updated
 */
const updateOne = async (id, data) =>
  await SkuDeactivationReason.updateOne({ id }, data);

/**
 * It updates the `deletedAt` field of the `SkuDeactivationReason` model with the current date
 * @param id
 */

const softDelete = async id =>
  await SkuDeactivationReason.updateOne({ id }, { deleted_at: new Date() });

/**
 * It returns a promise that resolves to an array of all the sku deactivation reasons in the database
 */
const findAll = async criteria =>
  await SkuDeactivationReason.find({
    ...criteria,
    deleted_at: null,
  }).limit(50);

module.exports = { create, updateOne, softDelete, findAll };

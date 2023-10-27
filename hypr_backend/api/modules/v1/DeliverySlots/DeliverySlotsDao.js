const {
  errors: { DELIVERY_SLOT_NOT_FOUND },
} = require("./Errors");

/**
 * This function takes criteria and returns VolumeBasedProductPrices
 *
 * @param {Object} criteria
 * @param {Number} skip
 * @param {Number} limit
 * @returns {Object[]} DeliverySlots
 */
const findByCriteria = async (criteria, skip, limit) =>
  await DeliverySlots.find(criteria).skip(skip).limit(limit);

/**
 * This function takes the id and return DeliverySlot
 *
 * @param {Number} id
 * @returns {Object} DeliverySlot
 */
const findById = async id => {
  if (!id) {
    return null;
  }

  const deliverySlot = await DeliverySlots.findOne({ id });
  if (_.isEmpty(deliverySlot)) {
    throw DELIVERY_SLOT_NOT_FOUND();
  }

  return deliverySlot;
};

/**
 * This function takes the criteria and return DeliverySlots count
 *
 * @param {Object} criteria
 * @returns {Number} total VolumeBasedProductPrices
 */
const count = async criteria => await DeliverySlots.count(criteria);

/**
 * This function takes the id, DeliverySlots and return updated DeliverySlots
 *
 * @param {Number} id
 * @param {Object} deliverySlot
 * @returns {Object} updated deliverySlot
 */
const update = async (id, deliverySlot) =>
  await DeliverySlots.updateOne({ id }, deliverySlot);

/**
 * Function takes criteria to be matched to one unique entity and update entries
 * @param {Object} Criteria to be matched
 * @param {Object} toUpdate to be updated
 * @returns {Object} Updated entity
 */
const updateByCriteria = async (criteria, toUpdate) =>
  await DeliverySlots.updateOne(criteria).set(toUpdate);

/**
 * This function takes the DeliverySlots and return new DeliverySlots
 *
 * @param {Object} deliverySlots
 * @returns {Object} DeliverySlots
 */
const createEach = async deliverySlots =>
  await DeliverySlots.createEach(deliverySlots);

/**
 * This function takes the Ids and return delete DeliverySlots
 *
 * @param {Number} slotId
 * @returns {Object} DeliverySlots
 */
const deleteById = async slotId =>
  await DeliverySlots.destroy({ id: slotId });

/**
 * This function takes locationId and date-range.
 * Returns the delivery slots for the next ${DELIVERY_SLOTS_DISPLAY_COUNT} days.
 *
 * @param {Number} locationId
 * @param {Date} startDate (local date in the format: YYYY-MM-DD)
 * @param {Date} endDate (local date in the format: YYYY-MM-DD)

 * @returns {Object[]} DeliverySlots
 */
const getAvailableDeliverySlots = async (locationId, startDate, endDate, customerId) => {
  const query = "CALL stp_get_delivery_slots_v1 ($1, $2, $3, $4)";
  const result = (await sails.getDatastore("readReplica").sendNativeQuery(query, [
    locationId, startDate, endDate, customerId,
  ]))?.rows[0];

  return result?.length > 0 ? result : [];
};

module.exports = {
  findByCriteria,
  findById,
  count,
  update,
  updateByCriteria,
  createEach,
  deleteById,
  getAvailableDeliverySlots,
};

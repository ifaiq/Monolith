/**
 *
 * @param {Object} customer_location
 * @returns {Object} customerLocation
 */
const toDto = customer_location => ({
  id: customer_location.id,
  customerId: customer_location.customer_id,
  locationId: customer_location.locationId,
});

module.exports = { toDto };

const createEach = async deliverySlots =>
  await DeliverySlotsAuditHistory.createEach(deliverySlots);


module.exports = {
  createEach,
};

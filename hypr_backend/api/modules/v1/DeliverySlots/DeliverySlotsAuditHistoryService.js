const deliverySlotsAuditHistoryDao = require("./DeliverySlotsAuditHistoryDao");

const createAuditHistory = async (updatedDeliverySlots, insertedDeliverySlots, userId) => {
  const updatedDeliverySlotsLogs = updatedDeliverySlots.map(deliverySlot => {
    const deliverySlotLog = {
      ...deliverySlot,
      deliverySlotId: deliverySlot.id,
      action: "UPDATED",
      performedBy: userId,
    };

    delete deliverySlotLog.id;
    return deliverySlotLog;
  });

  const insertedDeliverySlotsLogs = insertedDeliverySlots.map(deliverySlot => {
    const deliverySlotLog = {
      ...deliverySlot,
      deliverySlotId: deliverySlot.id,
      action: "INSERTED",
      performedBy: userId,
    };

    delete deliverySlotLog.id;
    return deliverySlotLog;
  });

  await Promise.all([
    deliverySlotsAuditHistoryDao.createEach([...updatedDeliverySlotsLogs, ...insertedDeliverySlotsLogs]),
  ]);
};


module.exports = {
  createAuditHistory,
};

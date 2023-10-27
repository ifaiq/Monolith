const errors = {
  DELIVERY_SLOT_NOT_FOUND: () => ({
    code: 3000,
    message: sails.__("DELIVERY_SLOT_NOT_FOUND"),
  }),
  INVALID_JIT_DELIVERY_SLOT: (selectedDeliverySlot, productId, availableDeliverySlot) => ({
    code: 3001,
    message: sails.__("INVALID_JIT_DELIVERY_SLOT", selectedDeliverySlot, productId, availableDeliverySlot),
  }),
  DELIVERY_SLOT_NO_LONGER_AVAILABLE: deliveryDate => ({
    code: 3002,
    message: sails.__("DELIVERY_SLOT_NO_LONGER_AVAILABLE", deliveryDate),
  }),
  DELIVERY_TIME_REQUIRED: productIds => ({
    code: 3003,
    message: sails.__("DELIVERY_TIME_REQUIRED", productIds),
  }),
  NO_DELIVERY_SLOTS_AVAILABLE: () => ({
    code: 3004,
    message: sails.__("NO_DELIVERY_SLOTS_AVAILABLE"),
  }),
};

module.exports = { errors };

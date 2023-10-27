const deliverySlots = require('./DeliverySlots')

module.exports = {
  tableName: "delivery_slots_audit_history",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    ...deliverySlots.attributes,
    deliverySlotId: {
      type: "number",
      columnType: "integer",
      columnName: "delivery_slot_id",
      required: true,
    },
    action: {
      type: "string",
      columnType: "varchar(10)",
    },
    performedBy: {
      type: "number",
      columnType: "integer",
      columnName: "performed_by",
      required: true,
    },
  }
}
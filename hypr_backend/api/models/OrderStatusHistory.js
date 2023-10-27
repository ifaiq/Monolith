module.exports = {
  tableName: "order_status_history",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      autoIncrement: true,
    },
    order_id: {
      model: "order",
    },
    status_id: {
      model: "OrderStatus",
    },
    updated_by: {
      type: "number",
      columnType: "integer",
      allowNull: true
    },
    updated_by_role: {
      type: "string",
      allowNull: true
    },
    device_id: {
      type: "string",
      allowNull: true
    },
    batch_id: {
      type: "number",
      allowNull: true
    }
  },
};

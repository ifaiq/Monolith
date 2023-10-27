module.exports = {
  tableName: "order_history",
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
    total_price: {
      type: "number",
      columnType: "float",
      required: false,
      allowNull: true,
    },
    status_id: {
      model: "OrderStatus",
    },
    oldOrderJSON: {
      type: "string",
      columnType: "JSON",
      allowNull: true,
    },
    newOrderJSON: {
      type: "string",
      columnType: "JSON",
      allowNull: true,
    },
  },
};

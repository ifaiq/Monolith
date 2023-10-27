module.exports = {
  tableName: "order_feedbacks",
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
      columnName: "order_id",
      model: "Order"
    },
    customer_id: {
      type: "number",
      allowNull:  true,
    },
    is_satisfied: {
      type: "boolean",
      allowNull:  true
    },
    notes: {
      type: "string",
      allowNull:  true,
    },
    dismissed: {
      type: "boolean",
      defaultsTo: false,
    },
  },
};

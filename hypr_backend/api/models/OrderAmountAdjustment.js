module.exports = {
  tableName: "order_amount_adjustments",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: 'integer',
      autoIncrement: true
    },
    order_id: {
      type: "number",
      columnType: 'integer',
      required: true,
    },
    context_id: {
      type: "number",
      columnType: 'integer',
      required: true,
    },
    context_name: {
      type: "string",
      columnType: "varchar(255)",
      required: true,
    },
  },
};
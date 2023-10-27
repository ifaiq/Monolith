module.exports = {
  tableName: "recommended_products_sql",
  created_at: true,
  updated_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      autoIncrement: true,
    },
    product_ids: {
      type: "string",
      required: true
    },
    customer_id: {
      type: "number",
      required: true
    },
  },
};

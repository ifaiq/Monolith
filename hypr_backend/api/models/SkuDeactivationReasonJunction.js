module.exports = {
  tableName: "sku_deactivation_reason_junction",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      autoIncrement: true,
    },
    is_deactivated: {
      type: "boolean",
      defaultsTo: false,
    },
    reason: {
      type: "string",
      columnType: "varchar(255)",
      allowNull: false,
    },
    slug: {
      type: "string",
      columnType: "varchar(255)",
      allowNull: false,
    },
    product_id: {
      model: "Product",
    },
    created_by: {
      type: "string",
      allowNull: false,
    },
  },
};

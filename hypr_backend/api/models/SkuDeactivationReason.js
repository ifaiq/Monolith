module.exports = {
  tableName: "sku_deactivation_reason",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      required: false,
      autoIncrement: true,
    },
    reason: {
      type: "string",
      allowNull: false,
    },
    slug: {
      type: "string",
      allowNull: false,
    },
    type: {
      type: "string",
      allowNull: false,
    },
    created_by: {
      type: "string",
      allowNull: false,
    },
  },
};

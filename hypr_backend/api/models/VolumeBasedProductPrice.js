module.exports = {
  tableName: "volume_based_product_price",
  created_at: true,
  updated_at: true,
  attributes: {
    deleted_at: false,
    id: {
      type: "number",
      columnType: "integer",
      required: false,
      autoIncrement: true,
    },
    productId: {
      columnName: "product_id",
      model: "Product",
    },
    price: {
      type: "number",
      columnType: "float",
      columnName: "price",
      allowNull: false,
    },
    quantityFrom: {
      type: "number",
      columnType: "integer",
      columnName: "quantity_from",
      allowNull: false,
    },
    quantityTo: {
      type: "number",
      columnType: "integer",
      columnName: "quantity_to",
      allowNull: true,
    },
    disabled: {
      type: "boolean",
      columnType: "boolean",
      columnName: "disabled",
      defaultsTo: true,
      allowNull: false,
    },
  },
};

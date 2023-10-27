module.exports = {
  tableName: "order_items",
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
    order_id: {
      model: "order",
    },
    product_id: {
      model: "Product",
    },
    quantity: {
      type: "number",
      allowNull: true,
      columnType: "integer",
    },
    original_quantity: {
      type: "number",
      allowNull: true,
      columnType: "integer",
    },
    price: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    packed_quantity: {
      type: "number",
      allowNull: true,
      columnType: "integer",
    },
    removed: {
      type: "boolean",
      defaultsTo: false,
    },
    tax: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    discount: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    adjusted_discount: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    adjusted_price: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    adjusted_tax: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    tax_category: {
      type: "number",
      columnType: "int",
      allowNull: true,
    },
    mrp: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    tax_percentage: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    name: {
      type: "string",
      required: false,
      columnType: "varchar(45)",
      allowNull: true,
    },
    volume_based_price: {
      type: "number",
      columnType: "float",
      allowNull: true,
    },
    volume_based_price_tax: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    volume_based_discount: {
      type: "number",
      allowNull: true,
      columnType: "float",
    },
    pricing_rule_history_id: {
      type: "number",
      columnType: "int",
      allowNull: true,
    },
  },
  beforeUpdate: async (orderItem, next) => {
    try {
      orderItem.created_at =
        typeof orderItem.created_at == "string"
          ? orderItem.created_at.split(".")[0]
          : orderItem.created_at;
      orderItem.updated_at =
        typeof orderItem.updated_at == "string"
          ? orderItem.updated_at.split(".")[0]
          : orderItem.updated_at;
      orderItem.deleted_at =
        typeof orderItem.deleted_at == "string"
          ? orderItem.deleted_at.split(".")[0]
          : orderItem.deleted_at;
    } catch (err) {
      console.log("ORDER ITEM HOOK ERROR", err);
    } finally {
      next();
    }
  },
};

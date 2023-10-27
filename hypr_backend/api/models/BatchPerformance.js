module.exports = {
  tableName: "batch_performances",
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
    delivered_gmv: {
      type: "number",
      columnType: "float",
      allowNull: false,
    },
    delivered_orders: {
      type: "number",
      columnType: "integer",
      allowNull: false,
    },
    delivered_touchpoints: {
      type: "number",
      columnType: "integer",
      allowNull: false,
    },
    total_orders: {
      type: "number",
      columnType: "integer",
      allowNull: false,
    },
    total_gmv: {
      type: "number",
      columnType: "float",
      allowNull: false,
    },
    total_touchpoints: {
      type: "number",
      columnType: "integer",
      allowNull: false,
    },
    agent_id: {
      type: "number",
      allowNull: false,
    },
    batch_id: {
      type: "number",
      allowNull: false,
    },
  },
};

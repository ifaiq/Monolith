module.exports = {
  tableName: "order_status_reason",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      autoIncrement: true,
    },
    reason: {
      type: "string",
      allowNull: true
    },
    description: {
      type: "string",
      allowNull: true
    },
    tag: {
      type: "string",
      allowNull: true
    },
    multilingual: {
      collection: 'OrderStatusReasonMultilingual',
      via: 'orderStatusReasonId'
    }
  },
};

module.exports = {
  tableName: "order_statuses",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number", 
      columnType: 'integer',
      autoIncrement: true
    },
    name: {
      type: "string",
      allowNull: true
    }
  },
};

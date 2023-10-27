module.exports = {
  tableName: "waivers",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: 'integer',
      autoIncrement: true
    },
    amount: {
      type: "number",
      columnType: "float",
    },
    reason_id: {
      type: "number",
      columnType: 'integer',
      required: true,
    },
    user_id: {
      type: "number",
      columnType: 'integer',
      required: true,
    },
  },
};
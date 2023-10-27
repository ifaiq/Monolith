module.exports = {
  tableName: "rtg_status",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
      id: {
          type: "number",
          columnType: "integer",
          autoIncrement: true,
      },
      status: {
        type: "string",
        columnType: "string",
        autoIncrement: true,
        required: true,
      },
  },
};
module.exports = {
  tableName: "auth_store",
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
    user: {
      type: "number",
      // model: "User",
      columnName: "user_id",
      allowNull: true
      
    },
    company: {
      type: "number",
      columnName: "company_id",
    },
    business_unit: {
      type: "number",
      columnName: "business_unit_id",
    },
    location: {
      type: "number",
      columnName: "location_id",
    },
    disabled: {
      type: "boolean",
      defaultsTo: false,
    },
  },
  afterUpdate: (data, next) => {
    AuthService.clearSessions({ user_id: data.user_id });
    next();
  },
};

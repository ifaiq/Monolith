module.exports = {
  tableName: "city_areas",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      autoIncrement: true,
    },
    name: {
      type: "string",
      allowNull: true,
    },
    disabled: {
      type: "boolean",
      allowNull: true,
    },
    company_id: {
      type: "number",
    },
    business_unit_id: {
      type: "number",
    },
    location_id: {
      type: "number",
    },
  },
};

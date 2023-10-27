module.exports = {
  tableName: "delivery_slots",
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
    locationId: {
      type: "number",
      columnType: "integer",
      columnName: "location_id",
      allowNull: false,
    },
    date: {
      type: "ref",
      columnType: "date",
      columnName: "date",
      allowNull: false,
    },
    cutOff: {
      type: "ref",
      columnType: "datetime",
      columnName: "cut_off",
      allowNull: false,
    },
    touchpointCapacity: {
      type: "number",
      columnType: "integer",
      columnName: "touchpoint_capacity",
      allowNull: false,
    },
    disabled: {
      type: "boolean",
      columnType: "boolean",
      columnName: "disabled",
      defaultsTo: false,
    },
    manuallyOverridden: {
      type: "boolean",
      columnType: "boolean",
      columnName: "manually_overridden",
      defaultsTo: false,
    },
  },
};

module.exports = {
  tableName: "account_settings",
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
    currency: {
      type: "string",
      allowNull: true
    },
    language: {
      type: "string",
      allowNull: true
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
    send_events: {
      type: "boolean",
    },
    app_type: {
      type: "number",
      allowNull: true,
      columnType: "integer",
    },
    shipment_method: {
      type: "number",
      allowNull: true,
      columnType: "integer",
    },
    disabled_at: {
      type: "string",
      allowNull: true,
    },
    disabled_by: {
      type: "number",
      allowNull: true
      // model: "user",
    },
    stripe_key: {
      type: "string",
      allowNull: true,
    },
    stripe_secret: {
      type: "string",
      allowNull: true,
    },
    messaging_service: {
      type: "string",
      allowNull: true,
    },
    product_led: {
      type: "boolean",
    },
    /* used to disable updateCart function */
    orders_disabled: {
      type: "boolean",
    },
    last_sync: {
      type: "ref",
      columnName: "last_sync",
      columnType: "datetime",
    },
  },
};
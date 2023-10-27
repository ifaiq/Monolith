const RedisService = require("../services/RedisService");

const clearCache = async (data) => {
  try {
    let tokenQuery = `${RedisService.FILTER_NAMES.token}_*${JSON.stringify(
      data.token
    )}_*`;
    sails.log(`Context: Sessions.clearCache tokenQuery: ${tokenQuery}`);
    return RedisService.client.del(tokenQuery);
  } catch (err) {
    sails.log.error(
      `Context: Sessions.clearCache Error in deleting token: ${data.id}`
    );
  }
};
module.exports = {
  tableName: "sessions",
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
    token: {
      type: "string",
      required: true,
      columnType: "varchar(1200)",
      allowNull: false,
    },
    customer_id: {
      type: "number",
      allowNull: true
      // model: "Customer",
    },
    user_id: {
      type: "number",
      allowNull: true
      // model: "User",
    },
    session_uuid: {
      type: "string",
      allowNull: true,
    },
    context_name: {
      type: "string",
      required: false,
      columnType: "varchar(255)",
      allowNull: true,
    },
    token_swapped: {
      type: "boolean",
      defaultsTo: false,
    },
  },
  afterDestroy: (data, next) => {
    clearCache(data).then((e) => next());
  },
};

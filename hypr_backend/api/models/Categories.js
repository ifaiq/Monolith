const { funnelService: { clearSortedsetRedis, clearFunnelFromRedis, } } = require('../modules/v1/Funnel');
const { CategoryTypes } = require("../constants/enums");
const { clearCategoryCache } = require('../modules/v1/Redis/RedisService');

module.exports = {
  tableName: "categories",
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
    parent: {
      model: "Categories",
      columnName: "parent_id",
    },
    sub_categories: {
      collection: "Categories",
      via: "parent",
    },
    name: {
      type: "string",
      required: false,
      columnType: "varchar(45)",
      allowNull: true,
    },
    image_url: {
      type: "string",
      allowNull: true,
    },
    priority: {
      type: "number",
      allowNull: true,
      columnType: "integer",
    },
    start_date: {
      type: "ref",
      columnType: "datetime",
    },
    end_date: {
      type: "ref",
      columnType: "datetime",
    },
    disabled_at: {
      type: "ref",
      columnType: "datetime",
    },
    disabled_by: {
      type: "number",
      allowNull: true
      // model: "User",
    },
    location_id: {
      type: "number",
    },
    multilingual: {
      collection: 'CategoryMultilingualAttribute',
      via: 'categoryId'
    },
    type: {
      type: "number",
      columnName: "type",
      columnType: "tinyint(1)",
      defaultsTo: CategoryTypes.CATEGORY,
      custom: function (value) {
        for (const [KEY, KEY_VALUE] of Object.entries(CategoryTypes)) {
          if (KEY_VALUE === value) return true;
        }
        return false;
      }
    },
  },
  afterCreate: (data, next) => {
    clearSortedsetRedis(data);
    clearCategoryCache(data).then((e) => next());
  },
  afterUpdate: (data, next) => {
    // clearFunnelFromRedis(data.id); //previously after update the category was removed from redis and the sorted set was cleared.
    // Then for every new request the respective sortedset was populated again
    clearSortedsetRedis(data);
    clearCategoryCache(data).then(() => next());
  },
  afterDestroy: (data, next) => {
    // clearFunnelFromRedis(data.id);
    clearSortedsetRedis(data);
    clearCategoryCache(data).then((e) => next());
  },
  beforeUpdate: async (category, next) => {
    try {
      delete category["created_at"];
      delete category["updated_at"];
      category.start_date =
        typeof category.start_date == "string"
          ? category.start_date.split(".")[0]
          : category.start_date;
      category.end_date =
        typeof category.end_date == "string"
          ? category.end_date.split(".")[0]
          : category.end_date;
      category.disabled_at =
        typeof category.disabled_at == "string"
          ? category.disabled_at.split(".")[0]
          : category.disabled_at;
    } catch (err) {
      console.log("CATEGORIES HOOK ERROR", err);
    } finally {
      next();
    }
  },
  beforeCreate: async (category, next) => {
    try {
      category.start_date =
        typeof category.start_date == "string"
          ? category.start_date.split(".")[0]
          : category.start_date;
      category.end_date =
        typeof category.end_date == "string"
          ? category.end_date.split(".")[0]
          : category.end_date;
      category.disabled_at =
        typeof category.disabled_at == "string"
          ? category.disabled_at.split(".")[0]
          : category.disabled_at;
    } catch (err) {
      console.log("CATEGORIES HOOK ERROR", err);
    } finally {
      next();
    }
  },
};

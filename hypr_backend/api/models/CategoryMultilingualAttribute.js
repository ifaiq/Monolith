const { funnelService: { clearSortedsetRedis, clearFunnelFromRedis, } } = require('../modules/v1/Funnel');
const { CategoryTypes } = require("../constants/enums");
const { find } = require("../modules/v1/Funnel/CategoryDao");
const { clearCategoryCache } = require('../modules/v1/Redis/RedisService');

module.exports = {
    tableName: "category_multilingual_attribute",
    created_at: true,
    updated_at: true,
    deleted_at: true,
    attributes: {
        id: {
            type: "number",
            columnType: 'int',
            required: false,
            autoIncrement: true,
            columnName: "id"
        },
        language: {
            type: "string",
            required: true,
            columnType: "varchar(4)",
            columnName: "language"
        },
        value: {
            type: "string",
            required: true,
            columnType: "varchar(255)",
            columnName: "value"
        },
        categoryId: {
            required: true,
            columnName: "category_id",
            model: 'categories'
        },
        attributeName: {
            required: true,
            type: "string",
            columnType: "VARCHAR(40)",
            columnName: "attribute_name"
        }
    },
    afterCreate: async (data, next) => {
        const category = await find(data.categoryId);
        clearSortedsetRedis(category);
        clearCategoryCache(category).then((e) => next());
    },
    afterUpdate: async (data, next) => {
        const category = await find(data.categoryId);
        clearFunnelFromRedis(category.categoryId);
        clearSortedsetRedis(category);
        clearCategoryCache(category).then(() => next());
    },
    afterDestroy: async (data, next) => {
        const category = await find(data.categoryId);
        clearFunnelFromRedis(category.categoryId);
        clearSortedsetRedis(category);
        clearCategoryCache(category).then((e) => next());
    },
};
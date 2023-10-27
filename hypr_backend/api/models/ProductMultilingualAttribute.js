const {
    redisService: {
        delAsync,
    },
    constants: { product: PRODUCT_REDIS_KEY },
} = require('../modules/v1/Redis');
const {
    productService: {
        clearAllAssociatedSortedsetsRedis,
        clearProductFromRedis,
    },
} = require('../modules/v1/Product');
const { clearProductCache } = require('../modules/v1/Redis/RedisService');

module.exports = {
    tableName: "product_multilingual_attribute",
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
        productId: {
            required: true,
            columnName: "product_id",
            model: 'product'
        },
        attributeName: {
            required: true,
            type: "string",
            columnType: "VARCHAR(40)",
            columnName: "attribute_name"
        }
    },
    afterCreate: (data, next) => {
        clearAllAssociatedSortedsetsRedis(data.productId);
        clearProductCache(data).then((e) => next());
    },
    afterUpdate: (data, next) => {
        clearAllAssociatedSortedsetsRedis(data.productId);
        clearProductFromRedis(data.productId);
        clearProductCache(data).then((e) => next());
    },
    afterDestroy: (data, next) => {
        clearAllAssociatedSortedsetsRedis(data.productId);
        clearProductFromRedis(data.productId);
        clearProductCache(data).then((e) => next());
    },
};
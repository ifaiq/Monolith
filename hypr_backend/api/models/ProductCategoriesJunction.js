const { 
  productService: {
    clearAllAssociatedSortedsetsRedis,
    clearProductCategorySortedset,
  },
} = require('../modules/v1/Product');

const clearCache = async (data) => {
  // clear all associated category products
  let categoryProductsQuery = `${RedisService.FILTER_NAMES.categoryProducts}_*category_id:${data.category_id}_*`;
  let categoryProductsAllQuery = `${RedisService.FILTER_NAMES.categoryProductsAll}_*category_id:${data.category_id}_*`;
  return Promise.all([
    RedisService.client.del(categoryProductsQuery),
    RedisService.client.del(categoryProductsAllQuery),
  ]);
};

module.exports = {
  tableName: "product_categories_junction",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number", 
      columnType: 'integer',
      required: false,
      autoIncrement: true
    },
    product_id: {
      model: "Product",
    },
    category_id: {
      model: "Categories",
    },
    product_priority: {
      type: "number",
      columnType: "integer",
      allowNull: true,
    }
  },
  afterCreate: (data, next) => {
    clearProductCategorySortedset(data.category_id); // for case when a new product is inserted in an existing category
    clearCache(data).then((e) => next());
  },
  afterUpdate: (data, next) => {
    clearAllAssociatedSortedsetsRedis(data.product_id);
    clearCache(data).then((e) => next());
  },
  afterDestroy: (data, next) => {
    clearProductCategorySortedset(data.category_id); // for case when a product gets removed from an existing category
    clearCache(data).then((e) => next());
  },
};

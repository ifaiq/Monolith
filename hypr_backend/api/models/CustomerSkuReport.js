const snakecaseKeys = require("snakecase-keys");

module.exports = {
  tableName: "customer_sku_report",
  created_at: true,
  updated_at: true,
  deleted_at: true,
  attributes: {
    id: {
      type: "number",
      columnType: "integer",
      autoIncrement: true,
    },
    customer_id: {
      type: "string",
      allowNull: false,
    },
    product_id: {
      type: "string",
      allowNull: false,
    },
    updated_by: {
      type: "string",
      allowNull: false,
    },
    file_url: {
      type: "string",
      allowNull: true,
    },
    file_name: {
      type: "string",
      allowNull: true,
    },
  },
  updateOrCreate: (data) => {
    return CustomerSkuReport
      .findOne()
      .where({ product_id: data.productId, customer_id: data.customerId })
      .then((result) => {
        if (result) {
          return CustomerSkuReport
            .update({ product_id: data.productId, customer_id: data.customerId })
            .set(snakecaseKeys(data))
        }else{
          return CustomerSkuReport.create(snakecaseKeys(data))
        }
      })
  }
};

/* eslint-disable max-len */
module.exports = {

  findById: async productId => await Product.findOne({ id: productId }),

  updateStockQuantityById: async (productId, updatedQuantity, updatedPhyicalQuantity) => await Product.updateOne({ id: productId }).set({ stock_quantity: updatedQuantity, physical_stock: updatedPhyicalQuantity }),

  /**
   *
   * @param {Object} product
   * @param {Number} originalQuantity
   * @param {Number} updatedQuantity
   * @param {String} eventType
   */
  createHistory: async (product, originalQuantity, updatedQuantity, eventType, originalPhysicalStock, updatedPhyicalStock) => {
    const history = {
      product_id: product.productId,
      old_JSON: JSON.stringify({ productId: product.productId, quantity: originalQuantity, physical: originalPhysicalStock }),
      new_JSON: JSON.stringify({ productId: product.productId, quantity: updatedQuantity, physical: updatedPhyicalStock }),
      source: `ODOO`,
      updated_by: null, // keeping this null for now, as we only have one user for odoo calls, so no need to track this for now
      reason: `ODOO - ${eventType}`,
    };
    await ProductAuditHistory.create(history);
  },

  createHistoryWMS: async (product, db, oldJson) => {
    const history = {
      product_id: product.id,
      new_JSON: JSON.stringify(product),
      source: `WMS`,
      reason: `WMS - ${product.type}`,
    };
    if (oldJson) {
      history.old_JSON = JSON.stringify(oldJson);
    }
    await ProductAuditHistory.create(history).usingConnection(db);
  },
};

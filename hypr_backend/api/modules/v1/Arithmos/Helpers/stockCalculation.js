const calculateProductsStock = (
  products = [],
  productMaxLimit = {},
  productOrderData = {},
) =>
  products.map(product => {
    if (productMaxLimit[product.id] && productOrderData[product.id]) {
      let remainingQuantity =
        parseInt(productMaxLimit[product.id]) -
        parseInt(productOrderData[product.id]);
      if (remainingQuantity > product.stockQuantity) {
        remainingQuantity = product.stockQuantity;
      }
      return {
        ...product,
        stockQuantity: remainingQuantity <= 0 ? 0 : remainingQuantity,
      };
    }
    return {
      ...product,
      ...(typeof product.quantityLimit === "number" &&
        product.quantityLimit > 0 && {
        stockQuantity:
            product.quantityLimit > product.stockQuantity
              ? product.stockQuantity
              : product.quantityLimit,
      }),
    };
  });

module.exports = {
  calculateProductsStock,
};

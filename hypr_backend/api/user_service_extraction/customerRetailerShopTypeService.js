const find = (criteria) => {
  try {
    return CustomerRetailerShopTypes.find(criteria);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  find
}

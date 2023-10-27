const find = (criteria) => {
  try {
    return CustomerRetailerOrderModes.find();
  } catch (error) {
    throw error;
  }
}

module.exports = {
  find
}

const {
  errors: {
    CART_NOT_FOUND,
  },
} = require("./Errors");
const {
  redisService: {
    hgetAsync,
    hsetAsync,
  },
  constants: { cart: CART_REDIS_KEY },
} = require("../Redis");

const findByCheckedId = async id => {
  const cart = await hgetAsync(CART_REDIS_KEY, JSON.stringify(id));
  if (_.isEmpty(cart)) {
    throw CART_NOT_FOUND();
  }
  return JSON.parse(cart);
};

const findById = async id => await findByCheckedId(id);
const update = async (id, cart) => await hsetAsync(CART_REDIS_KEY, JSON.stringify(id), JSON.stringify(cart));

module.exports = {
  findById,
  update,
};

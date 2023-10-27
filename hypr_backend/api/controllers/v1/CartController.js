const { cartService: {
  findCart,
  updateCart,
  generateCart,
}, messages: { CART_FETCHED_SUCCESSFULLY, CART_UPDATED_SUCCESSFULLY } } = require("../../modules/v1/Cart");
const {
  getPaymentsCashAmount,
} = require("../../modules/v1/Payments");
const {
  PAYMENT_TYPES: { COD_WALLET },
} = require("../../modules/v1/Order/Constants");

const update = async (req, res) => {
  const { user: { id, role }, user, body,
    headers: { clienttimeoffset: clientTimeOffset, language } } = req;
  const logIdentifier = `API version: V1, context: CartController.update(), UserId: ${id}, Role: ${role},`;
  try {
    const { validateCoupon, validateProducts, calculateTotal, validateCredit } = req.allParams();
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    // expect zone and shopTypeId in the body
    const cart = await updateCart({ ...user, clientTimeOffset, language },
      body, validateCoupon, validateProducts, calculateTotal, validateCredit);
    const responseOptions = {
      userMessage: CART_UPDATED_SUCCESSFULLY(),
    };
    res.ok(cart, responseOptions);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

/**
 *  Handler for generating cart total for logistics App
 */
const calculateCartTotal = async (req, res) => {
  const {
    user: { id, role }, user, body, query: { customerId },
    headers: { clienttimeoffset: clientTimeOffset, language },
  } = req;
  const logIdentifier =
    // eslint-disable-next-line max-len
    `API version: V1, context: CartController.calculateCartTotal(), UserId: ${id}, Role: ${role}, CustomerId: ${customerId}`;
  try {
    const validateCoupon = "true";
    const validateProducts = "true";
    const calculateTotal = "true";
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    let cart = await generateCart(
      { ...user, clientTimeOffset, language }, body, validateCoupon, validateProducts, calculateTotal, true, true,
    );
    if (cart.paymentType === COD_WALLET) {
      const amountPayable = await getPaymentsCashAmount(cart);
      cart = { ...cart, amountPayable: amountPayable.cashAmount, walletAmount: amountPayable.walletAmount };
    }
    res.ok(cart);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};

const read = async (req, res) => {
  const { userId, user: { role }, query: { customerId } } = req;
  const logIdentifier =
    `API version: V1, context: CartController.read(), UserId: ${userId}, Role: ${role}, CustomerId: ${customerId},`;
  try {
    sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
    const cart = await findCart(userId);
    const responseOptions = {
      userMessage: CART_FETCHED_SUCCESSFULLY(),
    };
    res.ok(cart, responseOptions);
  } catch (err) {
    sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
    res.error(err);
  }
};
const updateForExternalResource = async (req, res) => {
  const errorMsg = "deprecated API 404";
  return res.error(errorMsg);
  // const { body } = req;
  // const logIdentifier = `API version: V1, context: CartController.updateForExternalResource()`;
  // try {
  //   const { validateCoupon, validateProducts, calculateTotal, validateCredit } = req.allParams();
  //   sails.log(`${logIdentifier} called with params -> ${JSON.stringify(req.allParams())}`);
  //   const cart = await updateCart(body.user, body, validateCoupon, validateProducts, calculateTotal, validateCredit);
  //   const responseOptions = {
  //     userMessage: CART_UPDATED_SUCCESSFULLY(),
  //   };
  //   res.ok(cart, responseOptions);
  // } catch (err) {
  //   sails.log.error(`${logIdentifier} Error -> ${JSON.stringify(err.stack || err)}`);
  //   res.error(err);
  // }
};

module.exports = {
  read,
  update,
  calculateCartTotal,
  updateForExternalResource,
};

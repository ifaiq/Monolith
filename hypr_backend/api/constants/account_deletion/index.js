const { globalConf } = require("../../../config/globalConf");

const PAYMENT_WALLET = {
  baseUrl: globalConf.PAYMENT_WALLET_URL,
  endPoints: {
    paymentWalletDetails: "/api/v1/wallet/balance/",
  },
};

const BNPL_WALLET = {
  baseUrl: globalConf.BNPL_WALLET_URL,
  endPoints: {
    bnplWalletDetails: "/summary/walletDetails",
  },
};

const USER_SERVICE = {
  baseUrl: globalConf.USER_SERVICE_URL,
  endPoints: {
    customerDeletion: "/customer/",
  },
};

const OTP_SERVICE = {
  baseUrl: globalConf.OTP_SERVICE_URL,
  endPoints: {
    create: "/otp",
    send: "/otp/send",
    resend: "/otp/resend",
    verify: "/otp/verify",
  },
};

module.exports = {
  PAYMENT_WALLET,
  BNPL_WALLET,
  USER_SERVICE,
  OTP_SERVICE,
};

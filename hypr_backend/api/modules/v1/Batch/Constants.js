

// Please set this in your container env
const GROWTH_SERVICE_BASE_URL = process.env.MONOLITHIC_SERVICE || "https://dev.retailo.me";
module.exports = {
  URLS: {
    GROWTH_SERVICE_BASE_URL,
    DELETE_BATCH: "/growth/api/v1/batch/delivery/",
    UPDATE_JOB: "/growth/api/v1/jobs/complete/",
  },
  BATCH_STATES: {
    PENDING: 1,
    ACCEPTED: 2,
    ON_BOARDED: 3,
    IN_TRANSIT: 4,
    COMPLETED: 5,
    CLOSED: 6,
    CANCELED: 7,
  },

  NON_CASH_TYPES: {
    BANK_TRANSFER: 1,
    CHEQUE: 2,
    DIGITAL_WALLET: 3,
    FINJA_PAYMENTS: 4,
    PENDING_PAYMENTS: 5,
  },

  DIFFERENCE_REASONS: {
    THEFT: 1,
    LOST_MONEY: 2,
    LOST_ITEMS: 3,
    DO_NOT_KNOW_REASON: 4,
    DID_NOT_TAKE_INVENTORY: 5,
    OTHERS: 6,
  },

  RETURN_RESONS: {
    MISSING_INVENTORY: 1,
    LOST_INVENTORY: 2,
    DAMAGED_INVENTORY: 3,
  },

  BATCH_HISTORY_TYPES: {
    PENDING: "PENDING",
    CANCELED: "CANCELED",
    ACCEPTED: "ACCEPTED",
    COMPLETED: "COMPLETED",
    CLOSED: "CLOSED",
  },

  USECASE: "spotsale_customer_verification",
  SERVICE_NAME: "batch_service",

  RTG_STATES: {
    DONE: 1,
    IN_PROGRESS: 2,
    LOCKED: 3,
  },

};

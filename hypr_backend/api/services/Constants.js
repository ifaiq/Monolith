// TODO MOVE THIS FILE TO THE CONFIG FOLDER

// TODO ADD BLOCK LEVEL COMMENTS

// TODO MOVE ALL OF THESE CONSTANTS INTO A SINGLE module.export = {...}
module.exports.APP_TYPES = {
  HYPR: 1,
  CLIENT: 2,
};

module.exports.SHIPMENT_METHODS = {
  SELF_DELIVERY: 1,
  PARTNER_DELIVERY: 2,
};

module.exports.EVENTS = {
  Order_Packed: "Order Packed",
  Order_Assigned: "Order Assigned",
};

module.exports.HyprRolesObject = {

  CONSUMER: {
    id: 8,
    name: "CONSUMER",
  },
  SUPERVISOR: {
    id: 16,
    name: "SUPERVISOR",
  },
};

module.exports.HyprRoles = {
  ADMIN: 1,
  DRIVER: 4,
  PACKER: 5,
  DELIVERY: 6,
  STORE_MANAGER: 7,
  CONSUMER: 8,
  COMPANY_OWNER: 9,
  TDM_APP: 14,
  BU_MANAGER: 15,
  SUPERVISOR: 16,
  CS_REPRESENTATIVE: 17,
  LOGISTICS: 18,
  CARE: 19,
  COMMERCIAL: 20,
  GROWTH_SALES: 21,
  LEADS: 22,
  MONTREAL_INTERN: 23,
  SUPER_AGENT: 25,
  getKeyFromValue: value => Object.keys(Constants.HyprRoles).find(
    key => Constants.HyprRoles[key] === value,
  ),
};

module.exports.HyprNotificationType = {
  ALL_PACKER: 1,
  PACKER_ASSIGNED: 2,
  CUSTOMER_PLACE_ORDER: 3,
  PACKER_CANCELLED: 4,
  PACKED: 5,
  ORDER_MODIFIED: 6,
  CUSTOMER_SIGN_UP: 7,
  DELIVERED: 8,
  DELIVERY_ASSIGNED: 9,
  ALL_RIDERS: 10,
  DELIVERY_REJECTED: 11,
  ALL_RIDERS_ORDER_PLACED: 12,
  REJECTED_ON_PAYMENT_FAILURE: 13,
  ORDER_PAYMENT_TYPE_UPDATED: 14
};
module.exports.TipTypes = {
  FLAT: "FLAT",
  PERCENTAGE: "PERCENTAGE",
};
module.exports.CompanyTypes = {
  B2B: "B2B",
  B2C: "B2C",
};
module.exports.HyprOrderStates = {
  SALE_ORDER: 1,
  RESERVED: 2,
  PACKER_ASSIGNED: 3,
  PACKED: 4,
  IN_TRANSIT: 5,
  PACKER_CANCELLED: 6,
  RETURNED: 7,
  PARTIAL_DELIVERED: 8,
  DELIVERED: 9,
  CANCELLED: 10,
  REJECTED: 11,
  ON_HOLD: 12,
  MissingID: 99,
  getKeyFromValue: value => Object.keys(Constants.HyprOrderStates).find(
    key => Constants.HyprOrderStates[key] === value,
  ),
  getOrderStatusFromId: orderState => {
    switch (orderState) {
      case 1: return "SALE ORDER";
      case 2: return "RESERVED";
      case 3: return "PACKER ASSIGNED";
      case 4: return "PACKED";
      case 5: return "IN TRANSIT";
      case 6: return "PACKER CANCELLED";
      case 7: return "RETURNED";
      case 8: return "PARTIAL DELIVERED";
      case 9: return "DELIVERED";
      case 10: return "CANCELLED";
      case 11: return "REJECTED";
      case 12: return "ON HOLD";
      case 99: return "Missing ID";

      default: return "N/A";
    }
  },
};

module.exports.CouponDiscountTypes = {
  FIXED: 2,
  PERCENT: 1,
  getCouponTypeFromId: couponId => {
    switch (couponId) {
      case 1: return "Percentage";
      case 2: return "Fixed";
      default: return "N/A";
    }
  },
};

module.exports.CouponCustomerOptions = {
  EVERYONE: 1,
  SELECTED: 2,
};

module.exports.OPERATING_DAYS = {
  SUN: 1,
  MON: 2,
  TUE: 3,
  WED: 4,
  THUR: 5,
  FRI: 6,
  SAT: 7,
};

module.exports.COMPANIES = {
  MARK: "MARK",
  MONT: "MONT",
  RETAILO: "RET",
  CHASE: "CHASE",
};

module.exports.ORDER_LIMITS = {
  CHASE_ORDER_LIMIT_FOR_DELIVERY_CHARGE: 5000,
};

module.exports.S3_CONFIG = {
  GLOBAL_PARAMS: {
    Bucket: process.env.VOYAGER_BUCKET,
  },
  GLOBAL_PARAMS_V2: {
    Bucket: process.env.VOYAGER_BUCKET_V2,
  },
  DOWNLOAD_SIGNED_CONFIG: {
    Expires: 60 * 10 * 10, // Expires in 10 minutes i.e 600 seconds
  },
};

module.exports.ECS_CONFIG = {
  CLUSTER: process.env.VOYAGER_CLUSTER,
  TASK_DEF: process.env.VOYAGER_TASK_DEF,
  NAME: process.env.VOYAGER_NAME,
  CLUSTER_V2: process.env.VOYAGER_CLUSTER_V2,
  NAME_V2: process.env.VOYAGER_NAME_V2,
};

module.exports.VOYAGER = {
  MIN_MEMORY: 4096,
  CSV_CPU_VALUE_INDEX: 2,
};

module.exports.DeliveryBatchStates = {
  PENDING: 1,
  ACCEPTED: 2,
  ONBOARDED: 3,
  IN_TRANSIT: 4,
  COMPLETED: 5,
  CLOSED: 6,
  CANCELLED:7,

  getKeyFromValue: value => Object.keys(Constants.DeliveryBatchStates).find(
    key => Constants.DeliveryBatchStates[key] === value,
  ),
};

module.exports.ODDO_API_URLS = {
  AUTH_API: "web/session/authenticate/",
};

module.exports.TAX_CATEGORIES = {
  TAX_ON_PRICE: 1,
  TAX_ON_MRP: 2,
  NO_TAX: 3,
};

module.exports.GENERIC_CONSTANTS = {
  THIRTY_DAYS_BACK: 30 * 24 * 60 * 60 * 1000,
};

module.exports.DEFAULT_CURRENCIES = {
  PKR: "PKR",
};

module.exports.WAIVER_REASONS = {
  COMMERCIAL_WEIGHT_ISSUE: 1,
  COMMERCIAL_APP_PRICING_ERROR: 2,
  LOGISTICS_POST_DISPATCH_QUALITY_RETURNS: 3,
  LOGISTICS_POST_DISPATCH_DAMAGED: 4,
  SALES_PRICE_MISCOMMITMENT: 5,
  DISCOUNT_ERROR: 6,
  RETAILER_WANTS_EXTRA_DISCOUNT: 7,
  DAMAGE_ISSUE: 8,
  PAID_EXTRA: 9,
  CNIC_DISCOUNT: 10,
  getWaiverReasonFromId: reasonId => {
    switch (reasonId) {
      case 1: return "Commercial - Weight Issue";
      case 2: return "Commercial - App Pricing Error";
      case 3: return "Logistics - Post Dispatch Quality Returns";
      case 4: return "Logistics - Post Dispatch Damaged";
      case 5: return "Sales - Price Miscommitment";
      case 6: return "Discount Error";
      case 7: return "Retailer wants Extra discount";
      case 8: return "Damage/Quality/Expiry Issue";
      case 9: return "Paid Extra In Previous Order";
      case 10: return "CNIC Discount";
      case 12: return "KSA - Cashback Rewards";
      case 13: return "Delivery Fee Discount";
      default: return "N/A";
    }
  },
};

module.exports.ENVIRONMENTS = {
  LOCAL: "local",
  DEVELOPMENT: "development",
  STAGE: "stage",
  PRODUCTION: "production",
};

module.exports.COUPON_SKU_LIST_TYPE = {
  ALL_SKUS: 0,
  WHITELIST_SKUS: 1,
  BLACKLIST_SKUS: 2,
};

module.exports.ODOO_EVENT_TYPES = {
  SCRAP: "SCRAP",
  PURCHASE: "PURCHASE",
  ADJUSTMENT: "ADJUSTMENT",
  PURCHASE_RETURN: "PURCHASE RETURN",
};

module.exports.WMS_EVENT_TYPES = {
  RETURN: "RETURN",
  RECEIPT: "RECEIPT",
  ADJUSTMENT: "ADJUSTMENT",
  INITIAL_COUNT: "INITIAL_COUNT",
};

module.exports.ODOO_SQS_RETRY_EVENT_TYPES = {
  ADD_PRODUCT: 1,
  UPDATE_PRODUCT: 2,
  SALE_CREATE: 3,
  DELIVERY_RETURN: 4,
};

module.exports.CATEGORY_LEVEL = {
  PARENT_CATEGORY: 1,
  SUBCATEGORY: 2,
};

module.exports.CATEGORY_TYPE = {
  CATEGORY: 0,
  BRAND: 1,
};

module.exports.CURRENCY_TYPES = {
  PKR: "PKR",
  SAR: "SAR",
  AED: "AED",
  DEFAULT: "DEFAULT",
};

module.exports.LANGUAGE = {
  EN: "EN",
  UR: "UR",
  AR: "AR",
  RU: "RU",
};

module.exports.BASE_CURRENCY_MULTIPLIER = {
  PKR_100: 100, // PKR: base currency is paisa so we multiply it by 100
  SAR_10000: 10000, // SAR: base currency is halala so we multiply it by 10000
};

module.exports.TIMEZONES = {
  SAUDI: "Asia/Riyadh",
  PAK: "Asia/Karachi",
  ARE: "Asia/Dubai"
};

module.exports.FEATURES = {
  JIT: "JIT",
};

module.exports.ALLOWED_S3_UPLOAD_MIMETYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "application/zip",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

module.exports.INVENTORY_SYNC_TYPES = {
  BATCH_ACCEPT: 'BATCH_ACCEPT',
  BATCH_CLOSE: 'BATCH_CLOSE'
};

module.exports.BATCH_CSV_TYPES = {
  ORDER: 'order',
  PRODUCT: 'product'
};

module.exports.SLUGS = {
  WAREHOUSE: 'WAREHOUSE',
};

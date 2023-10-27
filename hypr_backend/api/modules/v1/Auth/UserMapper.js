const { DEFAULT_CURRENCIES: { PKR } } = require("../../../services/Constants");
const { LANGUAGES } = require("./Constants");

/**
 * This method is responsible to return entity for new customer
 * @param body received in the request
 * @param verificationCode
 * @param pinCode
 * @param companyId
 * @param businessUnitId
 * @returns customer
 */
const toCustomer = (body, verificationCode, pinCode, companyId, businessUnitId, taxId) => {
  const { customer, device } = body;

  return {

    // Shared between user and customer
    name: body.name,
    address: body.address,
    phone: body.phone,
    email: body.email,
    cnic: body.cnic,
    cnic_picture: body.cnicImageUrl,

    // Only for customer
    supervisor_id: customer.selfSignUp ? null : customer.supervisorId,
    has_smart_phone: customer.hasSmartPhone,
    secondary_phone: customer.secondaryPhone,
    order_mode: customer.orderMode || 1,
    DOB: customer.dob ? new Date(customer.dob) : null,
    verification_code: verificationCode.toString(),
    business_unit_id: businessUnitId,
    company_id: companyId,
    pin_code: pinCode,
    language: LANGUAGES[customer.language],
    tax_id: taxId,

    app_name: device && device.appName || null,
    app_version: device && device.appVersion || null,
    device_name: device && device.deviceName || null,
    os: body.os,

    // Default
    terms_accepted: true,
    verified_at: new Date(),
    customer_stripe_id: null,
    disabled: false,

  };
};

/**
 * This method is responsible to create customer's address
 * @param customerId
 * @param address
 * @returns customerAddress
 */
const toCustomerAddress = (customerId, address) => ({
  customer_id: customerId,
  address: address.address,
  address_line_1: address.addressLine1,
  address_line_2: address.addressLine2,
  location_cordinates: address.coordinates,
  delivered_location_cordinates: address.deliveredLocationCordinates,
  post_code: address.postCode,
  city_area: address.cityArea,
});

/**
 * This method is responsible to add customer's shop details
 * @param customerId
 * @param body
 * @returns customerShopDetails
 */
const toCustomerShopDetails = (customerId, body) => {
  const { shop } = body;
  return {
    customer_id: customerId,
    shop_name: shop.name,
    shop_location: shop.location,
    shop_type_id: shop.typeId,
    shop_picture: shop.picture,
    shop_open_time: shop.openTime,
    shop_close_time: shop.closeTime,
    shop_preferred_delivery_time: JSON.stringify(shop.preferredDeliveryTime),
    shop_closed_days: JSON.stringify(shop.closedDays),
  };
};

/**
 * Responsible for prepare object for sending SMS
 * @param customer
 * @returns {{send_to: *, business_unit_id: *, company_id: *}}
 */
const customerToSendSMS = customer => ({
  company_id: customer.company_id,
  business_unit_id: customer.business_unit_id,
  send_to: customer.phone,
});


/**
 * Responsible for preparing pin code send SMS
 * @param companyName
 * @param verificationCode
 * @returns {{args: [*, *], message: *}}
 */
const customerPinSMSBody = (companyName, verificationCode, hisaab = false) => ({
  message: sails.__("customer_pin_code"),
  args: [hisaab ? "Hisaab" : companyName, verificationCode],
});


/**
 * Responsible to convert hierarchy features to DTO
 * @param features array of hierarchy features
 * @returns hierarchy feature ids DTO
 */
const toFeatureIdsDto = features => {
  const featureListResponse = {};
  features.map(feature => { featureListResponse[feature.featureId.name] = !feature.disabled; });
  return featureListResponse;
};


/**
 * Responsible to convert customer entity to DTO
 * @param customer entity
 * @returns customer DTO
 * @private
 */
const _toCustomerDto = customer => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone,
  cnic: customer.cnic,
  language: LANGUAGES.getKeyFromValue(customer.language),
  verifiedAt: customer.verified_at,
  createdAt: customer.created_at,
  updatedAt: customer.updated_at,
  orderMode: customer.order_mode,
  roleId: customer.role.id,
  roleName: customer.role.name,
  taxId: customer.tax_id,
  isToolTip: customer.is_tool_tip,
  companyId: customer.companyId,
  businessUnitId: customer.businessUnitId,
  appName: customer.appName,
  appVersion: customer.appVersion,
  shopName: customer.shopDetails ? customer.shopDetails.shop_name : "",
  customerAddress: customer.address ? {
    id: customer.address.id,
    address: customer.address.address || "",
  } : "",
});

/**
 * Responsible to convert location entity to DTO
 * @param store location of warehouse
 * @returns warehouse DTO
 */
const toStoreDto = store => ({
  locationId: store.location_id,
  name: store.name,
  companyName: store.company_name,
  longitude: store.longitude,
  latitude: store.latitude,
  minOrderLimit: store.min_order_limit,
  maxOrderLimit: store.max_order_limit,
  currency: store.currency || store.companyDetails && store.companyDetails.currency || PKR,
});

/**
 * Responsible to create user DTO for sign in request
 * @param token newly generated
 * @param user entity
 * @returns sign-in request response DTO
 */
const toUserDto = (token = null, user) => {
  const userDto = {};
  if (token) {
    userDto.token = token;
  }
  userDto.user = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    cnic: user.cnic,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    roleId: user.role.id,
    roleName: user.role.name,
  };
  return userDto;
};

/**
 * Responsible to create customer address DTO
 * @param address entity fetched from db
 * @returns AddressDTO
 */
const toAddressDto = address => ({
  id: address.id,
  address: address.address,
  addressLine1: address.address_line_1,
  addressLine2: address.address_line_2,
  locationCoordinates: address.location_cordinates,
});

/**
 * This method is responsible to create DTO for find customer by phone
 * @param customer having phone
 * @param address belongs to customer
 * @param customerShop belongs to customer
 * @param store belongs to customer
 * @returns {{customerAddress: *, store: ([]|[*]), customer: *}}
 */
const toCustomerDetailsDto = (customer, address, customerShop, store, features) => ({
  customerId: customer.id,
  name: customer.name,
  phone: customer.phone,
  cnic: customer.cnic,
  shopName: customerShop.shop_name,
  customerAddress: toAddressDto(address),
  store: _.isEmpty(store) ? [] : {
    locationId: store.location_id,
    name: store.name,
    minOrderLimit: store.order_limit,
    maxOrderLimit: store.max_order_limit,
    currency: store.currency || store.companyDetails && store.companyDetails.currency || PKR,
    longitude: store.longitude,
    latitude: store.latitude,
  },
  features: toFeatureIdsDto(features),
});


/**
 * Responsible to prepare DTO for signIn/updateProfile API
 * @param token
 * @param customer
 * @param store
 * @returns DTO
 */
const toCustomerDto = (token = null, customer, store, features) => {
  const customerDto = {};
  if (token) {
    customerDto.token = token;
  }
  customerDto.user = _toCustomerDto(customer);
  if (store) {
    customerDto.store = toStoreDto(store);
  }
  if (features) {
    customerDto.features = toFeatureIdsDto(features);
  }

  return customerDto;
};

/**
 * Responsible for preparing DTO for featureJunctionListing API
 * @param _featureJunction
 * @returns {*|{}}
 */
const toFeatureCustomersDto = _featureJunction => {
  let featureJunction = {};
  featureJunction.featureName = _featureJunction.feature_id.name;
  featureJunction.featureId = _featureJunction.feature_id.id;
  featureJunction.createdAt = _featureJunction.created_at;
  featureJunction.updatedAt = _featureJunction.updated_at;
  featureJunction.customerId = _featureJunction.customer_id;
  delete _featureJunction.feature_id;
  delete _featureJunction.created_at;
  delete _featureJunction.updated_at;
  delete _featureJunction.customer_id;
  delete _featureJunction.deleted_at;
  featureJunction = { ..._featureJunction, ...featureJunction };
  return featureJunction;
};


module.exports = {
  toCustomer,
  toCustomerShopDetails,
  toCustomerAddress,
  customerToSendSMS,
  customerPinSMSBody,
  toCustomerDto,
  toUserDto,
  toCustomerDetailsDto,
  toFeatureIdsDto,
  toFeatureCustomersDto,
};

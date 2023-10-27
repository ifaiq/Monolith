/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  /** *************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions, unless overridden.       *
   * (`true` allows public access)                                            *
   *                                                                          *
   ***************************************************************************/

  // TODO Need to remove all other lines in the file and apply only this policy for every call to our server
  // "*": ["PublicRequestPolicy"],

  "*": ["isAuthenticated", "isRoleAllowed", "isAllowed", "localize"],

  HomeController: {
    index: true,
    clearRedis: true,
    healthCheck: true,
  },
  CustomerController: {
    forgotPassword: true,
  },
  LocationController: {
    getAllLocationsAndLocationOrdersForUser: ["isAuthenticated"],
    getAllLocationsForHierarchy: ["isAuthenticated"],
    getStores: true,
  },
  BusinessUnitController: {
    getBusinessUnitsForHierarchy: ["isAuthenticated"],
  },
  CompanyController: {
    getAllCompanies: ["isAuthenticated", "isRoleAllowed"],
    getCompanyCatalog: true /* NOTE: need to change later */,
  },
  UserController: {
    saveNotificationId: ["isAuthenticated", "isRoleAllowed"],
    saveLogoutNotificationId: ["isAuthenticated", "isRoleAllowed"],
    // TODO: attach s2s policy
    clearAndCreateNewAuthStore: ["externalAuth"],
  },
  StripeController: {
    "*": ["isAuthenticated"],
  },
  AuthController: {
    "*": true,
    onBoardB2BCustomer: ["isAuthenticated", "isRoleAllowed", "isAllowed"],
    signin: ["rateLimiter"],
  },
  CitiesController: {
    "*": true,
  },
  CategoriesController: {
    "*": ["isAuthenticated", "isRoleAllowed", "isAllowed", "localize"],
  },
  ProductController: {
    "*": ["isAuthenticated", "isRoleAllowed", "isAllowed", "localize"],
  },
  UtilsController: {
    "*": true,
  },
  WMSInventoryController: {
    "*": true,
    updateInventoryWMS: ["externalAuth"],
  },
  VersionController: {
    "*": true,
  },
  AppEventsController: {
    createAppEvent: true,
  },
  OrderController: {
    getOrderStatusReasons: ["isAuthenticated", "isRoleAllowed"],
  },
  SwaggerController: {
    "*": true,
  },
  "v1/OrderController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "OrderPolicy", "localize"],
    findLatestOrderByCustomerId: ["externalAuth", "OrderPolicy", "localize"],
    getOrderExternalResource: ["externalAuth", "OrderPolicy", "localize"],
    updateStatusConsumer: ["isAuthenticated", "RolePolicy", "isRoleAllowed", "OrderPolicy", "localize"],
  },
  "v1/CartController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "CartPolicy", "localize"],
    updateForExternalResource: ["externalAuth", "CartPolicy", "localize"],
  },
  "v1/UserController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "UserPolicy", "localize"],
    validateToken: ["isAuthenticated", "localize"],
    signUp: ["UserPolicy", "localize"],
    signIn: ["UserPolicy", "localize"],
    signOut: ["UserPolicy", "localize"],
    forgotPassword: ["UserPolicy", "localize"],
    getCustomerIdFromPhone: ["externalAuth", "UserPolicy", "localize"],
    getDataForIdentityService: ["externalAuth", "UserPolicy", "localize"],
    getRetailoCompany: ["externalAuth", "UserPolicy", "localize"],
    findCustomerById: ["externalAuth", "UserPolicy", "localize"],
    getCustomerDataById: ["externalAuth", "UserPolicy", "localize"],
    getUsersByRoleAndLocation: ["externalAuth", "UserPolicy", "localize"],
    checkRolePermission: ["externalAuth", "UserPolicy", "localize"],
    getAllUsers: ["UserPolicy", "localize"],
    clearUserSession: ["externalAuth", "UserPolicy", "localize"],
    sendSignupEmail: ["externalAuth", "UserPolicy", "localize"],
    fetchUserLocation: ["externalAuth", "UserPolicy", "localize"],
    deleteUser: ["isAuthenticated", "UserPolicy", "localize"],
    sendOTP: ["isAuthenticated"],
    verifyOTP: ["isAuthenticated"],
  },
  "v1/FunnelController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "FunnelPolicy", "localize"],
  },
  "v1/ProductController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "productPolicy", "localize"],
    getProductsFromSkus: ["externalAuth", "productPolicy"],
    getProductIdForExternalResource: ["externalAuth", "productPolicy"],
    getProductsForExternalResource: ["externalAuth", "productPolicy"],
    frequentlyOrderedItems: ["isAuthenticated", "RolePolicy", "productPolicy", "localize"],
  },
  "v1/BatchController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "BatchPolicy", "localize"],
    getBatches: ["externalAuth"],
    acceptBatch: ["externalAuth"],
    getOrdersOfCustomerByBatch: ["externalAuth"],
    // AuthenticationPolicy for below apis will be added once finalized
    getRtgCompleted: ["BatchPolicy", "localize"],
    getCashClosing: ["BatchPolicy", "localize"],
    getBatchReturnedProducts: ["BatchPolicy", "localize"],
    saveCashClosing: ["BatchPolicy", "localize"],
    getRtgCompletedProducts: ["BatchPolicy", "localize"],
    getInventoryShortage: ["BatchPolicy", "localize"],
    getBatchRemainingProducts: ["BatchPolicy", "localize"],
    updateBatchRtgStatus: ["BatchPolicy", "localize"],
    batchRtgUnAssign: ["BatchPolicy", "localize"],
    batchRtgAssign: ["BatchPolicy", "localize"],
    searchProductsInBatch: ["BatchPolicy", "localize"],
    attachSave: ["BatchPolicy", "localize"],
  },
  "v1/LocationController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "LocationPolicy", "localize"],
    getLocationById: ["externalAuth", "LocationPolicy"],
    getStoreFeatures: ["externalAuth", "LocationPolicy"],
    getLocationsByCriteria: ["externalAuth", "LocationPolicy"],
  },
  "v1/UserNotificationController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "UserNotificationPolicy"],
    sendCustomerNotification: ["externalAuth", "UserPolicy", "localize"],
  },
  "v1/EInvoiceController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "EInvoicePolicy"],
  },
  "v1/RolesAppVersionController": {
    "*": ["isAuthenticated", "RolePolicy", "RolesAppVersionPolicy"],
  },
  "v1/BusinessUnitController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "businessUnitPolicy", "localize"],
    getBusinessUnitById: ["externalAuth", "businessUnitPolicy"],
    getBusinessUnits: ["externalAuth"],
  },
  "v1/DeepLinksController": {
    "*": true,
  },
  "v2/CartController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "CartPolicy", "localize"],
    updateForExternalResource: ["externalAuth", "localize"],
  },
  "v2/OrderController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "OrderPolicy", "localize"],
  },
  "v1/OrderFeedbackController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "OrderFeedbackPolicy"],
  },
  "v1/DeliverySlotsController": {
    "*": ["isAuthenticated", "RolePolicy", "isRoleAllowed", "DeliverySlotsPolicy", "localize"],
  },
  "v1/CustomerSkuReportController": {
    "*": ["isAuthenticated", "RolePolicy",  "isRoleAllowed", "localize", "CustomerSkuReportPolicy"],
  },
  "v1/SkuDeactivationReasonController": {
    "*": ["isAuthenticated", "RolePolicy",  "isRoleAllowed", "localize", "SkuDeactivationReasonPolicy"],
  },
};

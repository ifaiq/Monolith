const voyagerServiceRoutes = require("../api/routes/VoyagerRoutes");
const { orderRoutes } = require("../api/modules/v1/Order");
const { cartRoutes } = require("../api/modules/v1/Cart");
const { productRoutes } = require("../api/modules/v1/Product");
const { categoryRoutes, brandRoutes } = require("../api/modules/v1/Funnel");
const { batchRoutes } = require("../api/modules/v1/Batch");
const { userRoutes, userPrivateRoutes } = require("../api/modules/v1/Auth");
const { locationRoutes } = require("../api/modules/v1/Location");
const { userNotificationRoutes } = require("../api/modules/v1/UserNotification");
const { eInvoiceRoutes } = require("../api/modules/v1/EInvoice");
const { rolesAppVersionRoutes } = require("../api/modules/v1/RolesAppVersion");
const { businessUnitRoutes } = require("../api/modules/v1/BusinessUnit");
const { cartRoutesv2 } = require("../api/modules/v2/Cart");
const { orderRoutesv2 } = require("../api/modules/v2/Order");
const { deepLinksRoutes } = require("../api/modules/v1/DeepLinks");
const { orderFeedbackRoutes } = require("../api/modules/v1/OrderFeedback");
const { deliverySlotsRoutes } = require("../api/modules/v1/DeliverySlots");
const { notificationMessages, waiverSwagger, productsSwagger } = require("../swagger/legacy_routes_docs");
const { customerSkuReportRoutes } = require("../api/modules/v1/CustomerSkuReport");
const { skuDeactivationReasonRoutes } = require("../api/modules/v1/SkuDeactivationReason");
module.exports.routes = {
  ...orderRoutes,
  ...cartRoutes,
  ...userRoutes,
  ...productRoutes,
  ...categoryRoutes,
  ...brandRoutes,
  ...userPrivateRoutes,
  ...batchRoutes,
  ...locationRoutes,
  ...userNotificationRoutes,
  ...eInvoiceRoutes,
  ...rolesAppVersionRoutes,
  ...businessUnitRoutes,
  ...cartRoutesv2,
  ...orderRoutesv2,
  ...deepLinksRoutes,
  ...orderFeedbackRoutes,
  ...deliverySlotsRoutes,
  ...customerSkuReportRoutes,
  ...skuDeactivationReasonRoutes,
  /* NOTE: APP VERSION ROUTES */
  "POST /appVersion/createAppVersion": "AppVersionController.createAppVersion",
  "GET /appVersion/getAppVersions": "AppVersionController.getAppVersions",
  "GET /appVersion/getAppVersionsByCompany":
    "AppVersionController.getAppVersionsByCompany",
  "POST /appVersion/updateAppVersion": "AppVersionController.updateAppVersion",
  "GET /version/checkAppVersion": "VersionController.checkAppVersion",
  /* NOTE: AUTH ROUTES */
  "POST /auth/signup": "AuthController.signup",
  "POST /auth/createRolesAndAuthzAccess": "AuthController.createRolesAndAuthzAccess",
  "POST /auth/logout": "AuthController.logout",
  "POST /auth/customerSignup": "AuthController.customerSignup",
  "POST /auth/signin": "AuthController.signin",
  "POST /auth/signinCustomer": "AuthController.signinCustomer",
  "POST /auth/signinChase": "AuthController.signInChaseWebApp",
  "POST /auth/onBoardB2BCustomer": "AuthController.onBoardB2BCustomer",
  "POST /auth/updatePassword": "AuthController.updatePassword",
  "POST /auth/verifyUser": "AuthController.verifyUser",
  "POST /auth/sendVerificationSms": "AuthController.sendVerificationSms",
  "POST /auth/createPassword": "AuthController.createPassword",
  "POST /auth/registerCustomer": "AuthController.registerCustomer",
  "POST /auth/forgotPassword": "AuthController.forgotPassword",
  "POST /auth/updateCustomerVerificationCode":
    "AuthController.updateCustomerVerificationCode",
  "GET /auth/checkCustomer": "AuthController.checkForCustomerExistence",

  /* NOTE: BUSINESS UNIT ROUTES */
  "GET /businessUnit": "BusinessUnitController.getAllBusinessUnits",
  "GET /getBusinessUnits":
    "BusinessUnitController.getBusinessUnitsForHierarchy",
  "GET /businessUnit/:id": "BusinessUnitController.retrieveBusinessUnit",
  "POST /businessUnit": "BusinessUnitController.createBusinessUnit",
  "PUT /businessUnit/:id": "BusinessUnitController.updateBusinessUnit",
  "GET /getCompanyBu": "BusinessUnitController.getCompanyBusinessUnits",

  /* NOTE: CATEGORY ROUTES */
  "GET /categories/getAllCategories": "CategoriesController.getAllCategories",
  "GET /categories/getCategoriesForStore":
    "CategoriesController.getCategoriesForStore",
  "GET /categories/getFellowCategories":
    "CategoriesController.getFellowCategories",
  "GET /categories/getAllAdminCategories":
    "CategoriesController.getAllAdminCategories",
  "POST /categories/createProductCategory": {
    controller: "CategoriesController",
    action: "createProductCategory",
    swagger: productsSwagger.createProductCategory,
  },
  "POST /categories/updateCategory": "CategoriesController.updateCategory",
  "POST /categories/updateSubCategoryPriority":
    "CategoriesController.updateSubCategoryPriority",
  /* NOTE: COMPANY ROUTES */
  "GET /company": "CompanyController.listCompanies",
  "GET /company/:id": "CompanyController.retrieveCompany",
  "POST /company": "CompanyController.createCompany",
  "PUT /company/:id": "CompanyController.updateCompany",
  "GET /getCompanyCatalogues": "CompanyController.getCompanyCatalog",
  // TODO: MOVE getAllCompanies TO COMPANY CONTROLLER AND CHANGE ROUTE ACCORDINGLY
  "GET /company/getAllCompanies": "CompanyController.getAllCompanies",
  "GET /company/getCompaniesByAppId": "CompanyController.getCompaniesByAppId",
  /* NOTE: CITY AREA ROUTES */
  "GET /city/areas": "CitiesController.getCityAreas",
  /* NOTE: CUSTOMER ROUTES */
  "GET /customer/getCustomersByLocation":
    "CustomerController.getCustomersByLocation",
  "GET /customer/getCustomerProfile": "CustomerController.getCustomerProfile",
  "GET /customer/getCustomerShopDetails":
    "CustomerController.getCustomerShopDetails",
  "GET /customer/getCustomerByPhone": "CustomerController.getCustomerByPhone",
  "GET /customer/getCustomerIdByPhone":
    "CustomerController.getCustomerIdByPhone",
  "GET /customer/getCustomerByCnic": "CustomerController.getCustomerByCnic",
  "GET /customer/getCustomerById": "CustomerController.getCustomerById",
  "GET /customer/getAllCustomers": "CustomerController.getAllCustomers",
  "POST /customer/createCustomer": "CustomerController.createCustomer",
  "POST /customer/updateCustomerProfile":
    "CustomerController.updateCustomerProfile",
  "POST /customer/setTermsAccepted": "CustomerController.setTermsAccepted",
  "GET /customer/getSuperVisorRetailers":
    "CustomerController.getSuperVisorRetailers",
  "POST /customer/forgotPassword": "CustomerController.forgotPassword",
  "POST /customer/disableCustomer": "CustomerController.disableCustomer",
  "POST /customer/updateCustomerProfileRetailo":
    "CustomerController.updateCustomerProfileRetailo",
  // DISABLE ROUTE FOR NOW: "GET /customer/getCustomerOnNewApp": "CustomerController.getCustomerOnNewApp",
  "POST /customer/setCardInfoCheck":
    "CustomerController.setCustomerCardInfoCheck",
  /* NOTE: DASHBOARD ROUTES */
  "GET /dashboard/getDashboardData": "DashboardController.getDashboardData",
  /* NOTE: HOME ROUTES */
  "GET /": "HomeController.index",
  "GET /health-check": "HomeController.healthCheck",
  "GET /home/clearRedis": "HomeController.clearRedis",
  /* NOTE: INVENTORY ROUTES */
  "POST /inventory/stockin": "InventoryController.stockIn",
  "POST /inventory/csvstockin": "InventoryController.CSVStockIn",
  "GET /inventory/getall": "InventoryController.getAllInventory",
  "GET /inventory/dump": "InventoryController.getInventoryDump",
  "GET /inventory/getInventoryHistory":
    "InventoryController.getInventoryHistory",
  /* NOTE: LOCATION ROUTES */
  "GET /location/getLocations": "LocationController.getLocations",
  "GET /location/getAllLocations": "LocationController.getAllLocations",
  "GET /location": "LocationController.getLocations",
  "GET /location/getAllLocationsForHierarchy":
    "LocationController.getAllLocationsForHierarchy",
  "POST /location": "LocationController.createLocation",
  "POST /location/updateLocation": "LocationController.updateLocation",
  "PUT /location/:id": "LocationController.updateLocationForHierarchy",
  "GET /location/getLocationById": "LocationController.getLocationById",
  "POST /location/getAllLocationsAndLocationOrdersForUser":
    "LocationController.getAllLocationsAndLocationOrdersForUser",
  "GET /location/getStores": "LocationController.getStores",
  "POST /location/registerLocation": "LocationController.registerLocation",
  /* NOTE: ORDER AND CART ROUTES */
  "POST /order/createCart": "OrderController.createOrderFromCart",
  "POST /order/updateCart": "OrderController.updateOrderFromCart",
  "POST /order/createOrderByCartId": "OrderController.placeOrderFromCart",
  "GET /order/getOrdersByStatus": "OrderController.getOrdersByStatus",
  "GET /order/getOrderStatus": "OrderController.getOrderStatus",
  "GET /order/getAllOrders": "OrderController.getAllOrders",
  "GET /order/getOrdersByCustomerReference":
    "OrderController.getOrdersByCustomerReference",
  "GET /order/getOrdersBySalesAgent": "OrderController.getOrdersBySalesAgent",
  "POST /order/markOrderStatus": "OrderController.markOrderStatus",
  "POST /order/addReceivedCash": "OrderController.addReceivedCash",
  "POST /order/updateOrder": "OrderController.updateOrder",
  "POST /order/assignOrderToDeliveryBoy":
    "OrderController.assignOrderToDeliveryBoy",
  "POST /order/unassignDeliveryBoy": "OrderController.unassignDeliveryBoy",
  "POST /order/assignOrderToPacker": "OrderController.assignOrderToPacker",
  "POST /order/refund": "OrderController.refundOrder",
  "GET /order/getPackerOrdersCount": "OrderController.getPackerOrdersCount",
  "GET /order/getPackerOrders": "OrderController.getPackerOrders",
  "POST /order/createOrderFromCart": "OrderController.createOrderFromCart",
  "POST /order/updateOrderFromCart": "OrderController.updateOrderFromCart",
  "POST /order/placeOrderFromCart": "OrderController.placeOrderFromCart",
  "GET /order/getCartAmount": "OrderController.getCartAmount",
  "POST /order/reservedQuantityByCart":
    "OrderController.reservedQuantityByCart",
  "POST /order/saveOrderDeliveredTimeStamp":
    "OrderController.saveOrderDeliveredTimeStamp",
  "POST /order/sendOrderStatusEvents": "OrderController.sendOrderStatusEvents",
  "GET /order/getPackerOrdersForStore":
    "OrderController.getPackerOrdersForStore",
  "POST /order/bulkAssignDeliveryOrders":
    "OrderController.bulkAssignDeliveryOrders",
  "GET /order/batchOrdersDump": "OrderController.batchOrdersDump",
  "GET /order/getCartData": "OrderController.getCartData",
  "GET /order/getOrdersCount": "OrderController.getOrdersCount",
  "POST /order/editOrder": "OrderController.editOrder",
  "POST /order/updateOrderLocation": "OrderController.updateOrderLocation",
  "POST /order/setCallCentreStatus":
    "OrderController.setOrderConfirmedByCallCentre",
  "GET /order/getStatusReasons": "OrderController.getOrderStatusReasons",
  "POST /order/bulkPackOrders": "OrderController.bulkPackOrders",
  "GET /order/getBatchOrdersData": "OrderController.getBatchOrdersData",
  /* NOTE: ORDER STATUS ROUTES */
  "GET /status/getAllOrderStatuses":
    "OrderStatusController.getAllOrderStatuses",
  /* NOTE: PERMISSIONS ROUTES */
  "GET /permission/listPermission": "PermissionController.listPermission",
  "GET /permission/getRolePermissionCodes":
    "PermissionController.getRolePermissionCodes",
  /* NOTE: COUPON ROUTES */
  "POST /coupon/createCoupon": "CouponController.createCoupon",
  "GET /coupon/getALLCoupons": "CouponController.getALLCoupons",
  "POST /coupon/updateCoupon": "CouponController.updateCoupon",
  /* NOTE: PRODUCT ROUTES */
  "POST /product/createProduct": {
    controller: "ProductController",
    action: "createProduct",
    swagger: productsSwagger.createProduct,
  },
  "POST /product/updateProduct": "ProductController.updateProduct",
  "POST /product/onBoardProducts": {
    controller: "ProductController",
    action: "onBoardProducts",
    swagger: productsSwagger.onBoardProducts,
  },
  "POST /product/onBoardMasterProducts":
    "ProductController.onBoardMasterProducts",
  "POST /product/updateMasterProducts":
    "ProductController.updateMasterProducts",
  "POST /product/updateProducts": {
    controller: "ProductController",
    action: "updateProducts",
    swagger: productsSwagger.updateProducts,
  },
  "POST /product/updateMultipleLocationPrices": {
    controller: "ProductController",
    action: "updateMultipleLocationPrices",
    swagger: productsSwagger.updateMultipleLocationPrices,
  },
  "POST /product/bulkUpdateSkuDeactivation": {
    controller: "ProductController",
    action: "bulkUpdateSkuDeactivation",
    swagger: productsSwagger.bulkUpdateSkuDeactivation,
  },
  "POST /product/bulkUpdateProductPriorities": {
    controller: "ProductController",
    action: "bulkUpdateProductPriorities",
    swagger: productsSwagger.bulkUpdateProductPriorities,
  },
  "POST /product/updateProductLocationPriceAndInventory":
    "ProductController.updateProductLocationPriceAndInventory",
  "POST /product/resetAllCategoryProductsPriorityByLocation":
    "ProductController.resetAllCategoryProductsPriorityByLocation",
  "POST /product/resetCategoryProductsPriorityByCategory":
    "ProductController.resetCategoryProductsPriorityByCategory",
  "POST /product/bulkUpdateDimensions": {
    controller: "ProductController",
    action: "bulkUpdateDimensions",
  },
  "GET /product/:id": "ProductController.retreiveProduct",
  "GET /product/getAllProducts": {
    controller: "ProductController",
    action: "getAllProducts",
    swagger: productsSwagger.getAllProducts,
  },

  "GET /product/getProductByCategory": {
    controller: "ProductController",
    action: "getProducts",
    swagger: productsSwagger.getProductByCategory,
  },

  "GET /product/getProductBrandAndSizesByCategory":
    "ProductController.getProductBrandAndSizesByCategory",
  "GET /product/searchFromEs": "ProductController.searchFromEs",
  // "GET /product/getProductDump": "ProductController.getProductDump", // turning it off
  "GET /product/getProductInfoByUrl": "ProductController.getProductInfoByUrl",
  // "POST /product/cloneCatalogue": "ProductController.cloneMasterCatalogueToLocation",

  /* NOTE: BATCH ROUTES */
  "POST /batch/create": "BatchController.createBatch",
  "GET /batch/getBatches": "BatchController.getBatches",
  "GET /batch/getOrdersByBatch": "BatchController.getOrdersByBatch",
  "POST /batch/updateAndAccept": "BatchController.updateAndAccept",
  "POST /batch/cancel": "BatchController.deleteBatch",
  "POST /batch/bulkCreate": "BatchController.bulkCreateBatches",

  /* NOTE: Catalogue ROUTES */
  "GET /catalogueProducts": "CatalogueController.get",
  "GET /updateCatalogue": "CatalogueController.updateCatalogue",
  /* NOTE: RETAILER ROUTES */
  "GET /retailer/getShopTypes":
    "RetailerController.getCustomerRetailerShopTypes",
  "GET /retailer/getOrderModes":
    "RetailerController.getCustomerRetailerOrderModes",
  "GET /retailer/getSuperVisor": "RetailerController.getSuperVisor",
  "GET /settings/saveLastSync": "SettingsController.saveLastSync",
  "GET /settings/syncRedashFromNull": "SettingsController.syncRedashFromNull",
  /* NOTE: STRIPE ROUTES */
  "POST /stripe/createCustomer": "StripeController.createCustomer",
  "POST /stripe/createPaymentMethod": "StripeController.createPaymentMethod",
  "POST /stripe/attachPaymentMethodToCustomer":
    "StripeController.attachPaymentMethodToCustomer",
  "GET /stripe/getCustomerPaymentMethods":
    "StripeController.getCustomerPaymentMethods",
  "POST /stripe/getStipeCustomer": "StripeController.getStipeCustomer",
  "POST /stripe/confirmPayment": "StripeController.confirmPayment",
  "POST /stripe/detachPaymentMethodFromCustomer":
    "StripeController.detachPaymentMethodFromCustomer",
  "POST /stripe/createPayment": "StripeController.createPayment",
  "POST /stripe/cancelPayment": "StripeController.cancelPayment",
  "POST /stripe/refundPayment": "StripeController.refundPayment",
  "POST /stripe/getCustomerPaymentMethods":
    "StripeController.getCustomerPaymentMethods",

  /* NOTE: UPLOAD ROUTES */
  "POST /upload/uploadFileToS3": "UploadController.uploadFileToS3",
  "POST /upload/uploadFeedFiles": "UploadController.uploadFeedFiles",
  "POST /upload/uploadProductImageToS3":
    "UploadController.uploadProductImageToS3",
  "POST /upload/uploadUserImageToS3": "UploadController.uploadUserImageToS3",
  /* NOTE: USER ROUTES */
  "POST /user/saveNotificationId": "UserController.saveNotificationId",
  "POST /user/saveLogoutNotificationId":
    "UserController.saveLogoutNotificationId",
  "GET /user/getUserByRoles": "UserController.getUserByRoles",
  "GET /user/getAllUsers": "UserController.getAllUsers",
  "POST /user/sendcustomMessage": "UserController.sendcustomMessage",
  "POST /user/changePassword": "UserController.changePassword",
  "POST /user/updateUser": "UserController.updateUser",
  "POST /api/user/clearAndCreateNewAuthStore": "UserController.clearAndCreateNewAuthStore",
  /* NOTE: ROLES ROUTES */
  "GET /roles/getAllRoles": "UserRolesController.getAllRoles",
  "GET /roles/createRole": "UserRolesController.createRole",

  /* NOTE: UTILITY ROUTES */
  "POST /updateOrders":
    "UtilsController.updateOrderStatusPacked",
  // "GET /utils/profileLock": "UtilsController.profileLock",
  "POST /updateTaxAttrs":
    "UtilsController.updateTaxRateAndCategory",
  "POST /addCustomers":
    "UtilsController.bulkCreateCustomers",
  "POST /addProducts":
    "UtilsController.createMissingProductsOnOdoo",
  "POST /toggleFeatureForCustomer":
    "UtilsController.bulkToggleFeatureForCustomers",
  "POST /addTpAndMrp":
    "UtilsController.updateTpAndMrp",
  "POST /createDeliveryReturns":
    "UtilsController.createMissingDeliveryReturnsOnOdoo",
  "POST /createSaleOrders":
    "UtilsController.createMissingSaleOrdersOnOdoo",
  "POST /utils/resetAllCategoryProductsPriorityByCompanyCode":
    "UtilsController.resetAllCategoryProductsPriorityByCompany",
  "POST /utils/addOperatingDaysByCompany":
    "UtilsController.addOperatingDaysByCompany",
  "GET /utils/redis/flush": "UtilsController.redisFlushKeys",
  "GET /utils/addPrioritiesForCategoriesOnLocation":
    "UtilsController.addPrioritiesForCategoriesOnLocation",
  "GET /utils/initializePriorityForAllLocations":
    "UtilsController.initializePriorityForAllLocations",
  "GET /utils/initializeOperatingDaysForAllLocations":
    "UtilsController.initializeOperatingDaysForAllLocations",
  "GET /utils/addproductsToEs": "UtilsController.addproductsToEs",
  "POST /utils/uploadProductImages": "UtilsController.uploadProductImages",
  "POST /utils/removeDuplicateCustomerAddresses":
    "UtilsController.removeDuplicateCustomerAddresses",
  "POST /utils/rejectOrders": "UtilsController.bulkRejectOrders",
  "POST /utils/updateImages": "UtilsController.updateImages",
  "GET /utils/updatePreviousLocationPriority":
    "UtilsController.updatePreviousLocationPriority",
  "GET /category/add/images": "UtilsController.replicateCategoryLocationImages",
  "GET /product/add/images": "UtilsController.replicateProductLocationImages",
  "POST /add/retailers": "UtilsController.onBoardB2BCustomer",
  "GET /set/migrationFlags": "UtilsController.setRetailoMigrationFlags",
  "POST /utils/sendHtmlFileThroughAwsSes": "UtilsController.sendHtmlFileThroughAwsSes",
  "POST /utils/softDeleteProduct": "UtilsController.softDeleteProduct",

  // "POST /add/retailers": "UtilsController.onBoardB2BCustomerFromRetailoSystem",
  "POST /send/bulk/sms": "UtilsController.sendBulkMessage",
  "GET /master/dump": "ProductController.getMasterCatalogDump",
  "POST /add/order": "UtilsController.onBoardB2BOrders",
  "POST /add/orderStatus": "UtilsController.onBoardOrderStatuses",
  "POST /add/orderItems": "UtilsController.onBoardB2BOrderItems",
  "GET /order/dump": "OrderController.getOrderDump",
  "POST /add/taxonomy": "UtilsController.addStatusTaxonomy",
  "POST /update/products": "UtilsController.markProductsDisabled",
  "POST /sms/bulk": "NotificationsController.sendBulkMessage",
  "POST /add/users": "UtilsController.bulkCreateUsers",
  "GET /utils/updateTestOrder": "UtilsController.updateTestOrder",
  "GET /notifications/getAllMessages": {
    controller: "NotificationMessageController",
    action: "getAllMessages",
    swagger: notificationMessages.getAllMessages,
  },
  "POST /notifications/createMessage": {
    controller: "NotificationMessageController",
    action: "createMessage",
    swagger: notificationMessages.createMessage,
  },
  "PUT /notifications/updateMessage":
    "NotificationMessageController.updateMessage",
  "POST /notifications/removeMessage":
    "NotificationMessageController.removeMessage",
  "GET /notifications/getRetailersByAppId":
    "NotificationCenterController.getRetailersByAppId",
  "POST /notifications/sendNotificationsToRetailers":
    "NotificationCenterController.sendNotificationsToRetailers",
  "POST /notifications/bulkSendNotifications":
    "NotificationCenterController.bulkSendNotifications",
  "POST /update/coordsOrArea": "UtilsController.correctCords",
  "POST /update/unverifyCustomers": "UtilsController.unverifyAndSignOutCustomers",
  "POST /update/areas": "UtilsController.correctTaggedAreas",
  // DEPRECATED "POST /update/coordsOrArea": "UtilsController.correctCords",
  // DEPRECATED "POST /update/areas": "UtilsController.correctTaggedAreas",
  "POST /update/bulkSetCustomersCNIC": "UtilsController.bulkSetCustomersCNIC",
  "POST /update/bulkSetCustomerCoords": "UtilsController.bulkSetCustomerCoords",
  "POST /update/bulkSetCustomerAreas": "UtilsController.bulkSetCustomerAreas",
  "POST /update/correcShopImages": "UtilsController.correcShopImages",
  // App events route
  "POST /add/event": "AppEventsController.createAppEvent",
  ...voyagerServiceRoutes,
  // TODO : Break routes.js into smaller modules
  // Tag routes.
  // TODO Add joi validation.
  "GET /tag": "TagController.getTags",
  "GET /tag/:id": "TagController.getTagById",
  "POST /tag": "TagController.createTag",
  "PUT /tag/:id": "TagController.updateTag",
  "GET /tag/search": "TagController.searchTag",
  /* NOTE: WAIVER ROUTES */
  "POST /waiver/create":
  {
    controller: "WaiverController",
    action: "createWaiver",
    swagger: waiverSwagger.postCreateWaiver,
  },
  "PUT /waiver/update": {
    controller: "WaiverController",
    action: "updateWaiver",
    swagger: waiverSwagger.putUpdateWaiver,
  },
  "POST /waiver/remove": {
    controller: "WaiverController",
    action: "removeWaiver",
    swagger: waiverSwagger.postRemoveWaiver,
  },

  "POST /utils/setCategoryImages":
    "UtilsController.setCategoryImages",

  "POST /recommendedProducts":
    "UtilsController.createRecommendedProducts",

  "POST /createCustomers":
    "UtilsController.bulkAddCustomersForBu",

  "POST /wms/updateInventory":
    "WMSInventoryController.updateInventoryWMS",

  "GET /swagger/getDocs": "SwaggerController.getDocs",

  "POST /sendBulkSms":
    "UtilsController.bulkSendMessagesAndSetBu",

  "POST /updateBulkCustomers":
    "UtilsController.bulkSetCustomerAttributes",

  "GET /customerDump":
    "UtilsController.fetchCustomerDump",

  "GET /userDump":
    "UtilsController.fetchUserDump",

  "POST /addPermissions":
    "UtilsController.addPermissionForSuperAgent",

  "POST /wms/validateAvailableInventory":
    "WMSInventoryController.validateProductInventoryWMS",

  "GET /redisData":
    "UtilsController.migrateRedis",
};

INSERT INTO permissions (id, code, api, method, created_at, updated_at) VALUES(1,'CODE','/appVersion/createAppVersion','POST',now(),now()),
(2,'L_APP_VER','/appVersion/getAppVersions','POST',now(),now()),
(3,'U_APP_VER','/appVersion/updateAppVersion','POST',now(),now()),
(4,'U_SIGNUP','/auth/signup','POST',now(),now()),
(5,'C_SIGNUP','/auth/customerSignup','POST',now(),now()),
(6,'U_SIGNIN','/auth/signin','POST',now(),now()),
(7,'C_SIGNIN','/auth/signinCustomer','POST',now(),now()),
(8,'C_B2B_ONBOARD','/auth/onBoardB2BCustomer','POST',now(),now()),
(9,'U_PASS','/auth/updatePassword','POST',now(),now()),
(10,'C_VERIFY','/auth/verifyUser','POST',now(),now()),
(11,'VERIFY_SMS','/auth/sendVerificationSms','POST',now(),now()),
(12,'C_CUST_PASS','/auth/createPassword','POST',now(),now()),
(13,'L_BU','/businessUnit','GET',now(),now()),
(14,'L_BU_H','/getBusinessUnits','GET',now(),now()),
(15,'R_BU','/businessUnit/','GET',now(),now()),
(16,'C_BU','/businessUnit','POST',now(),now()),
(17,'U_BU','/businessUnit/','PUT',now(),now()),
(18,'L_CAT','/categories/getAllCategories','GET',now(),now()),
(19,'L_ADMIN_CAT','/categories/getAllAdminCategories','GET',now(),now()),
(20,'C_CAT','/categories/createProductCategory','POST',now(),now()),
(21,'U_CAT','/categories/updateCategory','POST',now(),now()),
(22,'U_SUBCAT_P','/categories/updateSubCategoryPriority','POST',now(),now()),
(23,'L_COMP','/company','GET',now(),now()),
(24,'R_COMP','/company/','GET',now(),now()),
(25,'C_COMP','/company','POST',now(),now()),
(26,'U_COMP','/company/','PUT',now(),now()),
(27,'R_CUST_PROF','/customer/getCustomerProfile','GET',now(),now()),
(28,'R_CUST_PH','/customer/getCustomerByPhone','GET',now(),now()),
(29,'R_CUST_ID_PH','/customer/getCustomerIdByPhone','GET',now(),now()),
(30,'R_CUST_CNIC','/customer/getCustomerByCnic','GET',now(),now()),
(31,'R_CUST_ID','/customer/getCustomerById','GET',now(),now()),
(32,'L_CUSTOMERS','/customer/getAllCustomers','GET',now(),now()),
(33,'C_CUST','/customer/createCustomer','POST',now(),now()),
(34,'U_CUST_PROF','/customer/updateCustomerProfile','POST',now(),now()),
(35,'CUST_SET_TERMS','/customer/setTermsAccepted','POST',now(),now()),
(36,'L_SUPER_RETAILERS','/customer/getSuperVisorRetailers','GET',now(),now()),
(37,'L_DASH_DATA','/dashboard/getDashboardData','GET',now(),now()),
(38,'CLEAR_REDIS','/home/clearRedis','GET',now(),now()),
(39,'STOCK_IN','/inventory/stockin','POST',now(),now()),
(40,'CSV_STOCKIN','/inventory/csvstockin','POST',now(),now()),
(41,'L_INV','/inventory/getall','GET',now(),now()),
(42,'L_LOC','/location','GET',now(),now()),
(43,'L_LOC_H','/location/getAllLocationsForHierarchy','GET',now(),now()),
(44,'C_LOC','/location','POST',now(),now()),
(45,'U_LOC','/location/updateLocation','POST',now(),now()),
(46,'U_LOC2','/location/','PUT',now(),now()),
(47,'R_LOC_ID','/location/getLocationById','GET',now(),now()),
(48,'L_STORES','/location/getStores','GET',now(),now()),
(49,'L_ALL_COMP','/company/getAllCompanies','GET',now(),now()),
(50,'U_CART','/order/createCart','POST',now(),now()),
(51,'C_CART','/order/updateCart','POST',now(),now()),
(52,'C_ORDER','/order/createOrderByCartId','POST',now(),now()),
(53,'L_ORDER_BY_STATUS','/order/getOrdersByStatus','GET',now(),now()),
(54,'R_ORDER_STATUS','/order/getOrderStatus','GET',now(),now()),
(55,'L_ORDERS','/order/getAllOrders','GET',now(),now()),
(56,'L_ORDER_CUST_REF','/order/getOrdersByCustomerReference','GET',now(),now()),
(57,'U_ORDER_STATUS','/order/markOrderStatus','POST',now(),now()),
(58,'RCV_CASH','/order/addReceivedCash','POST',now(),now()),
(59,'U_ORDER','/order/updateOrder','POST',now(),now()),
(60,'ASSN_DEL_BOY','/order/assignOrderToDeliveryBoy','POST',now(),now()),
(61,'ASSN_PACKER','/order/assignOrderToPacker','POST',now(),now()),
(62,'ORDER_REFUND','/order/refund','POST',now(),now()),
(63,'PACK_ORDER_COUNT','/order/getPackerOrdersCount','GET',now(),now()),
(64,'L_PACKER_ORDER','/order/getPackerOrders','GET',now(),now()),
(65,'C_CART_ORDER','/order/createOrderFromCart','POST',now(),now()),
(66,'U_CART_ORDER','/order/updateOrderFromCart','POST',now(),now()),
(67,'PLACE_ORDER','/order/placeOrderFromCart','POST',now(),now()),
(68,'R_CART_AMOUNT','/order/getCartAmount','GET',now(),now()),
(69,'RESERVE_CART','/order/reservedQuantityByCart','POST',now(),now()),
(70,'ORDER_DELV_TIME','/order/saveOrderDeliveredTimeStamp','POST',now(),now()),
(71,'SEND_ORDER_EVENTS','/order/sendOrderStatusEvents','POST',now(),now()),
(72,'L_PACKER_ORDER_STORE','/order/getPackerOrdersForStore','GET',now(),now()),
(73,'BULK_ASSN_DEL','/order/bulkAssignDeliveryOrders','POST',now(),now()),
(74,'R_CART','/order/getCartData','GET',now(),now()),
(75,'R_ORDERS_COUNT','/order/getOrdersCount','GET',now(),now()),
(76,'EDIT_ORDER','/order/editOrder','POST',now(),now()),
(77,'L_ORDER_STATUSES','/status/getAllOrderStatuses','GET',now(),now()),
(78,'L_PERM','/permission/listPermission','GET',now(),now()),
(79,'L_PERM_CODES','/permission/getRolePermissionCodes','GET',now(),now()),
(80,'C_PROD','/product/createProduct','POST',now(),now()),
(81,'U_PROD','/product/updateProduct','POST',now(),now()),
(82,'ONBOARD_PROD','/product/onBoardProducts','POST',now(),now()),
(83,'BULK_U_PROD','/product/updateProducts','POST',now(),now()),
(84,'U_MULTI_LOC_PRICE','/product/updateMultipleLocationPrices','POST',now(),now()),
(85,'U_PRICE_INV','/product/updateProductLocationPriceAndInventory','POST',now(),now()),
(86,'R_PROD','/product/','GET',now(),now()),
(87,'L_PROD','/product/getAllProducts','GET',now(),now()),
(88,'L_PROD_CAT','/product/getProductByCategory','GET',now(),now()),
(89,'L_PROD_B&C_CAT','/product/getProductBrandAndSizesByCategory','GET',now(),now()),
(90,'R_PROD_ES','/product/searchFromEs','GET',now(),now()),
(91,'L_SHOP_TYPES','/retailer/getShopTypes','GET',now(),now()),
(92,'L_ORDER_MODES','/retailer/getOrderModes','GET',now(),now()),
(93,'C_STRIPE_CUST','/stripe/createCustomer','POST',now(),now()),
(94,'C_PM','/stripe/createPaymentMethod','POST',now(),now()),
(95,'ATT_PAY_M_CUST','/stripe/attachPaymentMethodToCustomer','POST',now(),now()),
(96,'L_STRIPE_CPM','/stripe/getCustomerPaymentMethods','GET',now(),now()),
(97,'R_STRIPE_CUSTOMER','/stripe/getStipeCustomer','POST',now(),now()),
(98,'CONFIRM_PAYMENT','/stripe/confirmPayment','POST',now(),now()),
(99,'DETACH_PM','/stripe/detachPaymentMethodFromCustomer','POST',now(),now()),
(100,'C_PAYMENT','/stripe/createPayment','POST',now(),now()),
(101,'CANCEL_PAYMENT','/stripe/cancelPayment','POST',now(),now()),
(102,'REFUND_PAYMENT','/stripe/refundPayment','POST',now(),now()),
(103,'U_FILE_S3','/upload/uploadFileToS3','POST',now(),now()),
(104,'S3_FEED','/upload/uploadFeedFiles','POST',now(),now()),
(105,'U_PROD_IMG','/upload/uploadProductImageToS3','POST',now(),now()),
(106,'C_IMG_S3','/upload/uploadUserImageToS3','POST',now(),now()),
(107,'C_NOTI_ID','/user/saveNotificationId','POST',now(),now()),
(108,'D_NOTI_ID','/user/saveLogoutNotificationId','POST',now(),now()),
(109,'L_ROLE_USER','/user/getUserByRoles','GET',now(),now()),
(110,'L_USERS','/user/getAllUsers','GET',now(),now()),
(111,'CUSTOM_SMS','/user/sendcustomMessage','POST',now(),now()),
(112,'CHANGE_USER_PASS','/user/changePassword','POST',now(),now()),
(113,'U_USER','/user/updateUser','POST',now(),now()),
(114,'L_ROLES','/roles/getAllRoles','GET',now(),now()),
(115,'C_ROLE','/roles/createRole','GET',now(),now()),
(116,'REDIS_FLUSH','/utils/redis/flush','GET',now(),now()),
(117,'U_CAT_LOC_P','/utils/addPrioritiesForCategoriesOnLocation','GET',now(),now()),
(118, 'FELLOW_CAT', '/categories/getFellowCategories', 'GET', now(), now()),
(119,'L_ALL_LOC','/location/getAllLocations','GET',now(),now()),
(120, 'USER_LOC_ORDER', '/location/getAllLocationsAndLocationOrdersForUser', 'POST', now(), now());
INSERT INTO role_permissions(role_id, permission_id, created_at, updated_at) 
VALUES (7,'112',now(), now()),
(5,'64',now(), now()),
(5,'53',now(), now()),
(7,'55',now(), now()),
(7,'109',now(), now()),
(7,'82',now(), now()),
(6,'53',now(), now()),
(6,'76',now(), now()),
(6,'57',now(), now()),
(5,'76',now(), now()),
(5,'57',now(), now()),
(7,'53',now(), now()),
(7,'39',now(), now()),
(7,'57',now(), now()),
(7,'20',now(), now()),
(7,'87',now(), now()),
(7,'103',now(), now()),
(7,'83',now(), now()),
(7,'105',now(), now()),
(7,'80',now(), now()),
(7,'81',now(), now()),
(7,'41',now(), now()),
(7,'60',now(), now()),
(8,'28',now(), now()),
(8,'59',now(), now()),
(8,'57',now(), now()),
(8,'89',now(), now()),
(8,'34',now(), now()),
(8,'106',now(), now()),
(8,'88',now(), now()),
(7,'76',now(), now()),
(7,'27',now(), now()),
(9,'109',now(), now()),
(9,'114',now(), now()),
(9,'55',now(), now()),
(9,'53',now(), now()),
(9,'41',now(), now()),
(9,'87',now(), now()),
(9,'2',now(), now()),
(9,'110',now(), now()),
(9,'28',now(), now()),
(9,'112',now(), now()),
(9,'76',now(), now()),
(9,'39',now(), now()),
(9,'60',now(), now()),
(9,'106',now(), now()),
(9,'27',now(), now()),
(9,'34',now(), now()),
(9,'3',now(), now()),
(9,'81',now(), now()),
(9,'80',now(), now()),
(9,'20',now(), now()),
(9,'103',now(), now()),
(9,'82',now(), now()),
(9,'83',now(), now()),
(9,'105',now(), now()),
(9,'57',now(), now()),
(9,'40',now(), now()),
(9,'45',now(), now()),
(14,'55',now(), now()),
(14,'41',now(), now()),
(14,'54',now(), now()),
(14,'52',now(), now()),
(14,'68',now(), now()),
(14,'54',now(), now()),
(14,'51',now(), now()),
(14,'50',now(), now()),
(14,'56',now(), now()),
(14,'18',now(), now()),
(14,'21',now(), now()),
(14,'88',now(), now()),
(5,'63',now(), now()),
(14,'90',now(), now()),
(9,'18',now(), now()),
(14,'70',now(), now()),
(8,'68',now(), now()),
(8,'69',now(), now()),
(14,'69',now(), now()),
(8,'54',now(), now()),
(8,'18',now(), now()),
(8,'50',now(), now()),
(8,'51',now(), now()),
(8,'52',now(), now()),
(8,'56',now(), now()),
(8,'90',now(), now()),
(5,'61',now(), now()),
(8,'48',now(), now()),
(5,'107',now(), now()),
(6,'107',now(), now()),
(9,'13',now(), now()),
(9,'18',now(), now()),
(8,'107',now(), now()),
(5,'59',now(), now()),
(6,'60',now(), now()),
(5,'108',now(), now()),
(6,'108',now(), now()),
(8,'108',now(), now()),
(9,'37',now(), now()),
(9,119,now(), now()),
(15,119,now(), now()),
(9,79,now(), now()),
(15,79,now(), now()),
(7,79,now(), now()),
(9,119,now(), now()),
(15,119,now(), now()),
(7,119,now(), now()),
(9,77,now(), now()),
(15,77,now(), now()),
(7,77,now(), now()),
(9,43,now(), now()),
(9,16,now(), now()),
(9,44,now(), now()),
(15,44,now(), now()),
(9,17,now(), now()),
('7', '106', now(), now()),
('15', '106', now(), now()),
('15', '20', now(), now()),
('7', '22', now(), now()),
('9', '22', now(), now()),
('15', '22', now(), now()),
('9', '88', now(), now()),
('15', '88', now(), now()),
('7', '88', now(), now()),
('7', '21', now(), now()),
('9', '21', now(), now()),
('15', '21', now(), now()),
('15', '55', now(), now()),
('15', '76', now(), now()),
('15', '57', now(), now()),
('7', '73', now(), now()),
('9', '73', now(), now()),
('15', '73', now(), now()),
('15', '53', now(), now()),
('15', '109', now(), now()),
('15', '60', now(), now()),
('7', '61', now(), now()),
('9', '61', now(), now()),
('15', '61', now(), now()),
('15', '39', now(), now()),
('7', '62', now(), now()),
('9', '62', now(), now()),
('15', '62', now(), now()),
('15', '41', now(), now()),
('7', '40', now(), now()),
('15', '40', now(), now()),
('7', '45', now(), now()),
('15', '45', now(), now()),
('15', '110', now(), now()),
('9', '4', now(), now()),
('15', '4', now(), now()),
('9', '113', now(), now()),
('15', '113', now(), now()),
('15', '114', now(), now()),
('9', '14', now(), now()),
('15', '43', now(), now()),
('7', '19', now(), now()),
('9', '19', now(), now()),
('15', '19', now(), now()),
('9', '14', now(), now()),
('9', '49', now(), now()),
('9', '84', now(), now()),
(6, 120, now(), now()),
(9, 32, now(), now());
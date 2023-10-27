/*
   SECTION 1: covering all consumer app api's
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'U_USER_PROFILE_RBAC', '/api/v1/user/profile', 'PUT', now(), now()),
    ('RBAC', 'G_USER_BY_PHONE_RBAC', '/api/v1/user', 'GET', now(), now()),
    ('RBAC', 'P_UPSERT_NOTIFICATION_RBAC', '/api/v1/notification/upsertUserNotification', 'POST', now(), now()),
    ('RBAC', 'G_CUSTOMER_FEATURES_RBAC', '/api/v1/user/getCustomerFeatures', 'GET', now(), now()),
    ('RBAC', 'G_CART_RBAC', '/api/v1/cart', 'GET', now(), now()),
    ('RBAC', 'P_CART_RBAC', '/api/v1/cart', 'PUT', now(), now()),
    ('RBAC', 'G_CATEGORY_RBAC', '/api/v1/category', 'GET', now(), now()),
    ('RBAC', 'P_ORDER_RBAC', '/api/v1/order', 'POST', now(), now()),
    ('RBAC', 'G_ORDER_STATUSES_RBAC', '/api/v1/order/statuses', 'GET', now(), now()),
    ('RBAC', 'P_EINVOICE_RBAC', '/api/v1/e-invoice', 'POST', now(), now()),
    ('RBAC', 'G_PRODUCTS_RBAC', '/api/v1/product', 'GET', now(), now()),
    ('RBAC', 'G_PRODUCTS_ES_RBAC', '/api/v1/product/searchFromEs', 'GET', now(), now()),
    ('RBAC', 'P_PRODUCT_LIKED_RBAC', '/api/v1/product/liked', 'POST', now(), now()),
    ('RBAC', 'G_PRODUCT_LIKED_RBAC', '/api/v1/product/liked', 'GET', now(), now()),
    ('RBAC', 'G_PRODUCT_PREVIOUS_ORDERED_RBAC', '/api/v1/product/previousOrderedItems', 'GET', now(), now()),
    ('RBAC', 'G_PRODUCT_RECOMMENDED_RBAC', '/api/v1/product/recommendedProducts', 'GET', now(), now()),
    ('RBAC', 'P_UPLOAD_FILE_RBAC', '/upload/uploadFileToS3', 'POST', now(), now()),
    ('RBAC', 'G_LOCATION_BANNERS_RBAC', '/api/v1/location/?/banners', 'GET', now(), now()),
    ('RBAC', 'G_ORDER_DETAILS_RBAC', '/api/v1/order/?', 'GET', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (8, (SELECT id from permissions where code = 'U_USER_PROFILE_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'U_USER_PROFILE_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_USER_BY_PHONE_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_USER_BY_PHONE_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'P_UPSERT_NOTIFICATION_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_UPSERT_NOTIFICATION_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_CUSTOMER_FEATURES_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_CUSTOMER_FEATURES_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_CART_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_CART_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'P_CART_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_CART_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_CATEGORY_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_CATEGORY_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'P_ORDER_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_ORDER_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_ORDER_STATUSES_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_ORDER_STATUSES_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'P_EINVOICE_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_EINVOICE_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_PRODUCTS_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_PRODUCTS_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_PRODUCTS_ES_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_PRODUCTS_ES_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'P_PRODUCT_LIKED_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_PRODUCT_LIKED_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_PRODUCT_LIKED_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_PRODUCT_LIKED_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_PRODUCT_PREVIOUS_ORDERED_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_PRODUCT_PREVIOUS_ORDERED_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_PRODUCT_RECOMMENDED_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_PRODUCT_RECOMMENDED_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'P_UPLOAD_FILE_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_UPLOAD_FILE_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_LOCATION_BANNERS_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_LOCATION_BANNERS_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_ORDER_DETAILS_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_ORDER_DETAILS_RBAC'), now(), now());


/*
   SECTION 2: covering all logistics app api's
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'G_BATCHES_RBAC', '/batch/getBatches', 'GET', now(), now()),
    ('RBAC', 'P_UPDATE_ACCEPT_BATCH_RBAC', '/batch/updateAndAccept', 'POST', now(), now()),
    ('RBAC', 'P_CALCULATE_CART_TOTAL_RBAC', '/api/v1/cart/calculateCartTotal', 'POST', now(), now()),
    ('RBAC', 'P_SET_ORDER_STATUS_LOGISTICS_RBAC', '/api/v1/order/setOrderStatusLogistic', 'PUT', now(), now()),
    ('RBAC', 'G_STATUS_REASON_RBAC', '/order/getStatusReasons', 'GET', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (6, (SELECT id from permissions where code = 'P_UPLOAD_FILE_RBAC'), now(), now()),
    (6, (SELECT id from permissions where code = 'G_BATCHES_RBAC'), now(), now()),
    (6, (SELECT id from permissions where code = 'P_UPDATE_ACCEPT_BATCH_RBAC'), now(), now()),
    (6, (SELECT id from permissions where code = 'P_CALCULATE_CART_TOTAL_RBAC'), now(), now()),
    (6, (SELECT id from permissions where code = 'P_SET_ORDER_STATUS_LOGISTICS_RBAC'), now(), now()),
    (6, (SELECT id from permissions where code = 'G_STATUS_REASON_RBAC'), now(), now());


/*
   SECTION 3: covering all supervisor app api's
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'G_CITY_AREAS_RBAC', '/city/areas', 'GET', now(), now()),
    ('RBAC', 'G_SHOP_TYPES_RBAC', '/retailer/getShopTypes', 'GET', now(), now()),
    ('RBAC', 'G_ORDER_MODES_RBAC', '/retailer/getOrderModes', 'GET', now(), now()),
    ('RBAC', 'G_CUSTOMER_RETAILERS_RBAC', '/customer/getSuperVisorRetailers', 'GET', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (16, (SELECT id from permissions where code = 'G_CITY_AREAS_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_SHOP_TYPES_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_ORDER_MODES_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_CUSTOMER_RETAILERS_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'C_B2B_ONBOARD'), now(), now());

  /*
    SECTION 4: covering all company owner role api's
 */
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'D_LOCATION_BANNERS_RBAC', '/api/v1/location/?/banners', 'DELETE', now(), now()),
    ('RBAC', 'P_LOCATION_BANNERS_RBAC', '/api/v1/location/?/banners', 'PUT', now(), now()),
    ('RBAC', 'P_ORDER_STATUS_PORTAL_RBAC', '/api/v1/order/setOrderStatusPortal', 'PUT', now(), now()),
    ('RBAC', 'P_UPDATE_BATCH_RBAC', '/api/v1/batch/?', 'PUT', now(), now()),
    ('RBAC', 'P_PRODUCT_MULTILING_RBAC', '/api/v1/product/multilingual', 'PUT', now(), now()),
    ('RBAC', 'P_CATEGORY_MULTILING_RBAC', '/api/v1/category/multilingual', 'PUT', now(), now());

INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'D_LOCATION_BANNERS_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_LOCATION_BANNERS_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_LOCATION_BANNERS_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_CATEGORY_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_ORDER_STATUS_PORTAL_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_UPDATE_BATCH_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_PRODUCT_MULTILING_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_CATEGORY_MULTILING_RBAC'), now(), now());
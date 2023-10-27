/* Replace with your SQL commands */

/*
   SECTION 1: covering all missing api's iteration-1
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'G_RETAILER_MODES_RBAC', '/retailer/getOrderModes', 'GET', now(), now()),
    ('RBAC', 'G_RETAILER_SHOP_TYPES_RBAC', '/retailer/getShopTypes', 'GET', now(), now()),
    ('RBAC', 'G_ORDER_STATUS_REASONS_RBAC', '/order/getStatusReasons', 'GET', now(), now()),
    ('RBAC', 'P_BULK_PACK_ORDERS_RBAC', '/order/bulkPackOrders', 'POST', now(), now()),
    ('RBAC', 'P_BULK_CREATE_RBAC', '/batch/bulkCreate', 'POST', now(), now()),
    ('RBAC', 'P_CREATE_WAIVER_RBAC', '/waiver/create', 'POST', now(), now()),
    ('RBAC', 'G_APP_VERSION_COMPANY_RBAC', '/appVersion/getAppVersionsByCompany', 'GET', now(), now()),
    ('RBAC', 'G_BUSINESS_UNIT_RBAC', '/businessUnit/?', 'GET', now(), now()),
    ('RBAC', 'G_LOCATION_RBAC', '/location/?', 'GET', now(), now()),
    ('RBAC', 'G_INVENTORY_DUMP_RBAC', '/inventory/dump', 'GET', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'G_RETAILER_MODES_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_RETAILER_SHOP_TYPES_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_ORDER_STATUS_REASONS_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_BULK_PACK_ORDERS_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_BULK_CREATE_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_CREATE_WAIVER_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_BATCHES_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_APP_VERSION_COMPANY_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_BUSINESS_UNIT_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_LOCATION_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_INVENTORY_DUMP_RBAC'), now(), now());
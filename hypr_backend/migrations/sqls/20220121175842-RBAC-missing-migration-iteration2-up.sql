/*
   SECTION 1: covering all missing api's iteration-2
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'P_UPDATE_WAIVER_RBAC', '/waiver/update', 'PUT', now(), now()),
    ('RBAC', 'P_REMOVE_WAIVER_RBAC', '/waiver/remove', 'POST', now(), now()),
    ('RBAC', 'P_BATCH_CANCEL_RBAC', '/batch/cancel', 'POST', now(), now()),
    ('RBAC', 'G_INVENTORY_HISTORY_RBAC', '/inventory/getInventoryHistory', 'GET', now(), now()),
    ('RBAC', 'P_BUSINESS_UNIT_RBAC', '/businessUnit/?', 'PUT', now(), now()),
    ('RBAC', 'P_LOCATION_RBAC', '/location/?', 'PUT', now(), now()),
    ('RBAC', 'G_PRODUCT_DUMP_RBAC', '/product/getProductDump', 'GET', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'P_UPDATE_WAIVER_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_REMOVE_WAIVER_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_BATCH_CANCEL_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_INVENTORY_HISTORY_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_BUSINESS_UNIT_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_LOCATION_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_PRODUCT_DUMP_RBAC'), now(), now());
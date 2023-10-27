/*
   RBAC permissions for frequently Ordered Items API
*/
INSERT INTO
    permissions (name, code, api, method, created_at,updated_at)
VALUES
    ('RBAC', 'G_PRODUCT_FREQUENTLY_ORDERED_RBAC', '/api/v1/product/frequentlyOrderedItems', 'GET', now(), now());
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (8, (SELECT id from permissions where code = 'G_PRODUCT_FREQUENTLY_ORDERED_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_PRODUCT_FREQUENTLY_ORDERED_RBAC'), now(), now());

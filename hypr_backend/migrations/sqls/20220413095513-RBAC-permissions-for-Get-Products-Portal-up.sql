/*
   RBAC permissions for product portal api
*/
INSERT INTO
    permissions (name, code, api, method, created_at,updated_at)
VALUES
    ('RBAC', 'G_PRODUCTS_PORTAL', '/api/v1/product/portal', 'GET', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'G_PRODUCTS_PORTAL'), now(), now());
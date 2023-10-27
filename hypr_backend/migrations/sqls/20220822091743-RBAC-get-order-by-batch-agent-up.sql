/*
   RBAC permissions for growth order metrics API
*/
INSERT INTO
    permissions (name, code, api, method, created_at,updated_at)
VALUES
    ('RBAC', 'G_ORDERS_BY_BATCH_RBAC', '/api/v1/batch/?/orders', 'GET', now(), now());
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (6, (SELECT id from permissions where code = 'G_ORDERS_BY_BATCH_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_ORDERS_BY_BATCH_RBAC'), now(), now()),
    (25, (SELECT id from permissions where code = 'G_ORDERS_BY_BATCH_RBAC'), now(), now());

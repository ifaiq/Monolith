/*
   RBAC permissions for create spot orders API
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'G_GET_SPOT_PRODUCTS', '/api/v1/batch/spot-products', 'GET', now(), now());
 
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (6, (SELECT id from permissions where code = 'G_GET_SPOT_PRODUCTS'), now(), now());
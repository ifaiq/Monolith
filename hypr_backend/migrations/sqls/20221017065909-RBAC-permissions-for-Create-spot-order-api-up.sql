/*
   RBAC permissions for create spot orders API
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'P_CREATE_SPOT_ORDER', '/api/v1/order/spot-sale', 'POST', now(), now());
 
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (6, (SELECT id from permissions where code = 'P_CREATE_SPOT_ORDER'), now(), now());
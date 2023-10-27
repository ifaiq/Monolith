/*
   RBAC permissions for set order status API
*/
 
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (16, (SELECT id from permissions where code = 'P_ORDER_STATUS_RBAC_V2'), now(), now());
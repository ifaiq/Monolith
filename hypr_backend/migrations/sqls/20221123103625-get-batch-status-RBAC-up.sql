/*
   RBAC permissions for create spot orders API
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'G_GET_BATCH_STATUS_BY_ID', '/api/v1/batch/status', 'GET', now(), now());
 
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (6, (SELECT id from permissions where code = 'G_GET_BATCH_STATUS_BY_ID'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_GET_BATCH_STATUS_BY_ID'), now(), now());
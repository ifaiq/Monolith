/* Replace with your SQL commands */

INSERT INTO
    permissions (name, code, api, method, created_at,updated_at)
VALUES
    ('RBAC', 'P_IN_APP_ACCOUNT_DELETION_RBAC', '/', 'POST', now(), now());
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (8, (SELECT id from permissions where code = 'P_IN_APP_ACCOUNT_DELETION_RBAC'), now(), now());
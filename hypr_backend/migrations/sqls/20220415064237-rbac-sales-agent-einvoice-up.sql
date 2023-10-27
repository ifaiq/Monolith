INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (16, (SELECT id from permissions where code = 'P_EINVOICE_RBAC'), now(), now());
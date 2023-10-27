-- Adding Voyager APIs for the following roles:
-- - Company Owner
-- - Admin

INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'P_EINVOICE_CREDIT_NOTE_BULK', '/api/v1/e-invoice/bulk-generate-cn', 'POST', now(), now());

INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'P_EINVOICE_CREDIT_NOTE_BULK'), now(), now()),
    (1, (SELECT id from permissions where code = 'P_EINVOICE_CREDIT_NOTE_BULK'), now(), now());

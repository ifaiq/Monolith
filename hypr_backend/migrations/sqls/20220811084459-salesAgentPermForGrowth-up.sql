/* Replace with your SQL commands */

INSERT INTO
    permissions (name, code, api, method, created_at,updated_at)
VALUES
    ('RBAC', 'G_BRAND_GROWTH_RBAC', '/api/v1/brand', 'GET', now(), now());
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (16, (SELECT id from permissions where code = 'G_BRAND_GROWTH_RBAC'), now(), now());
/* Replace with your SQL commands */
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'P_ED_REPORTING_CREATE', '/api/v1/report-customer-sku', 'POST', now(), now()),
    ('RBAC', 'P_ED_REPORTING_GET', '/api/v1/report-customer-sku', 'GET', now(), now());
 
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'P_ED_REPORTING_CREATE'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_ED_REPORTING_GET'), now(), now());
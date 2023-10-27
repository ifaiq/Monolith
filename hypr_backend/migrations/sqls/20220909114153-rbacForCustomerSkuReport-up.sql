/* Replace with your SQL commands */
INSERT IGNORE INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('CUSTOMER_SKU_REPORT_RBAC', 'P_CUSTOMER_SKU_REPORT_RBAC', '/api/v1/report-customer-sku', 'POST', now(), now());

INSERT IGNORE INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9,  (SELECT id from permissions where code = 'P_CUSTOMER_SKU_REPORT_RBAC'), now(), now());
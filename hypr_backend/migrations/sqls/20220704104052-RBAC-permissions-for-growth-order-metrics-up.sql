/*
   RBAC permissions for growth order metrics API
*/
INSERT INTO
    permissions (name, code, api, method, created_at,updated_at)
VALUES
    ('RBAC', 'G_ORDER_GROWTH_METRICS_RBAC', '/api/v1/order/growthMetrics', 'GET', now(), now());
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (16, (SELECT id from permissions where code = 'G_ORDER_GROWTH_METRICS_RBAC'), now(), now());

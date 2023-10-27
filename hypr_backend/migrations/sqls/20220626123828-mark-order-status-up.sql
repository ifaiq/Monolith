/* Replace with your SQL commands */


INSERT INTO
    permissions (name, code, api, method, created_at,updated_at)
VALUES
    ('RBAC', 'G_MARK_ORDER_STATUS_CONSUMER_RBAC', '/api/v1/order/setOrderStatusConsumer', 'PUT', now(), now());
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (8, (SELECT id from permissions where code = 'G_MARK_ORDER_STATUS_CONSUMER_RBAC'), now(), now());
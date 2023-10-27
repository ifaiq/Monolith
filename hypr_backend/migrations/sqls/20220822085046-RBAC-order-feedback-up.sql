/*
    RBAC permissions for order-feedback routes - CLE-409
*/
INSERT IGNORE INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('ORDER_FEEDBACK_RBAC', 'P_ORDER_FEEDBACK_CREATE_FEEDBACK', '/api/v1/order-feedback', 'POST', now(), now()),
    ('ORDER_FEEDBACK_RBAC', 'G_ORDER_FEEDBACK_ORDER', '/api/v1/order-feedback/order', 'GET', now(), now()),
    ('ORDER_FEEDBACK_RBAC', 'G_ORDER_FEEDBACKS_CUSTOMER', '/api/v1/order-feedback/customer', 'GET', now(), now()),
    ('ORDER_FEEDBACK_RBAC', 'G_ORDER_FEEDBACK_MISSING_FEEDBACK_ORDER', '/api/v1/order-feedback/feedback-missing-order', 'GET', now(), now());

INSERT IGNORE INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (8,  (SELECT id from permissions where code = 'P_ORDER_FEEDBACK_CREATE_FEEDBACK'), now(), now()),
    (8,  (SELECT id from permissions where code = 'G_ORDER_FEEDBACK_ORDER'), now(), now()),
    (8,  (SELECT id from permissions where code = 'G_ORDER_FEEDBACKS_CUSTOMER'), now(), now()),
    (8,  (SELECT id from permissions where code = 'G_ORDER_FEEDBACK_MISSING_FEEDBACK_ORDER'), now(), now()),
    (16,  (SELECT id from permissions where code = 'P_ORDER_FEEDBACK_CREATE_FEEDBACK'), now(), now()),
    (16,  (SELECT id from permissions where code = 'G_ORDER_FEEDBACK_ORDER'), now(), now()),
    (16,  (SELECT id from permissions where code = 'G_ORDER_FEEDBACKS_CUSTOMER'), now(), now()),
    (16,  (SELECT id from permissions where code = 'G_ORDER_FEEDBACK_MISSING_FEEDBACK_ORDER'), now(), now());
/* Replace with your SQL commands */

/*
   SECTION 1: covering all missing api's iteration-1
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC_v2', 'P_ORDER_STATUS_RBAC_V2', '/api/v1/order/v2/setOrderStatusLogistic', 'PUT', now(), now()),
    ('RBAC_v2', 'P_ORDER_STATUS_PORTAL_RBAC_V2', '/api/v1/order/v2/setOrderStatusPortal', 'PUT', now(), now()),
    ('RBAC_v2', 'P_RECALCULATIONS_LOGISTICS_RBAC_V2', '/api/v1/cart/v2/calculateCartTotal', 'POST', now(), now());

INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (6, (SELECT id from permissions where code = 'P_ORDER_STATUS_RBAC_V2'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_ORDER_STATUS_PORTAL_RBAC_V2'), now(), now()),
    (6, (SELECT id from permissions where code = 'P_RECALCULATIONS_LOGISTICS_RBAC_V2'), now(), now());


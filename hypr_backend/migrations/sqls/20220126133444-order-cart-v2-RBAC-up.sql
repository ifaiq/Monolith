/* Replace with your SQL commands */

/*
   SECTION 1: covering all missing api's iteration-1
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC_v2', 'P_CART_V2', '/api/v1/cart/v2', 'PUT', now(), now()),
    ('RBAC_v2', 'P_ORDER_V2', '/api/v1/order/v2', 'POST', now(), now());

INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (8, (SELECT id from permissions where code = 'P_CART_V2'), now(), now()),
    (8, (SELECT id from permissions where code = 'P_ORDER_V2'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_CART_V2'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_ORDER_V2'), now(), now());
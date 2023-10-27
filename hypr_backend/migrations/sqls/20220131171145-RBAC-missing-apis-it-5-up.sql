/* Replace with your SQL commands */

/*
   SECTION 1: covering all missing api's iteration-5
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'G_CUSTOMER_BY_LOC_RBAC', '/customer/getCustomersByLocation', 'GET', now(), now()),
    ('RBAC', 'G_TAG_RBAC', '/tag', 'GET', now(), now()),
    ('RBAC', 'G_TAG_BY_ID_RBAC', '/tag/?', 'GET', now(), now()),
    ('RBAC', 'P_TAG_RBAC', '/tag', 'POST', now(), now()),
    ('RBAC', 'P_UPDATE_TAG_RBAC', '/tag/?', 'PUT', now(), now()),
    ('RBAC', 'P_CREATE_MESSAGE_RBAC', '/notifications/createMessage', 'POST', now(), now()),
    ('RBAC', 'P_REMOVE_PLAYER_ID', '/api/v1/user/removePlayerId', 'POST', now(), now()),
    ('RBAC', 'P_CUSTOMER_DATA', '/api/v1/user/customer-data', 'POST', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'G_CUSTOMER_BY_LOC_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_TAG_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_TAG_BY_ID_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_TAG_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_UPDATE_TAG_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_CREATE_MESSAGE_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'P_REMOVE_PLAYER_ID'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_REMOVE_PLAYER_ID'), now(), now()),
    (8, (SELECT id from permissions where code = 'P_CUSTOMER_DATA'), now(), now());
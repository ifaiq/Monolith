/* Replace with your SQL commands */

/* user service customer apis */
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('USER_SERVICE_RBAC', 'G_CUSTOMER_USER_SERVICE_RBAC', '/byPhone', 'GET', now(), now()),
    ('USER_SERVICE_RBAC', 'P_UPDATE_PROFILE_USER_SERVICE_RBAC', '/profile', 'PUT', now(), now()),
    ('USER_SERVICE_RBAC', 'G_CUSTOMER_BY_LOCATION_USER_SERVICE_RBAC', '/byLocation', 'GET', now(), now()),
    ('USER_SERVICE_RBAC', 'G_CUSTOMER_BY_SUPERVISOR_USER_SERVICE_RBAC', '/bySupervisor', 'GET', now(), now()),
    ('USER_SERVICE_RBAC', 'G_ALL_CUSTOMERS_OR_USERS_USER_SERVICE_RBAC', '/getAll', 'GET', now(), now()),
    ('USER_SERVICE_RBAC', 'G_CUSTOMER_PROFILE_USER_SERVICE_RBAC', '/profile', 'GET', now(), now()),
    ('USER_SERVICE_RBAC', 'P_ON_BOARD_CUSTOMER_USER_SERVICE_RBAC', '/onBoard', 'POST', now(), now()),
    ('USER_SERVICE_RBAC', 'P_UPDATE_CUSTOMER_PORTAL_USER_SERVICE_RBAC', '/updateCustomerProfile', 'POST', now(), now()),
    ('USER_SERVICE_RBAC', 'P_CUSTOMER_PROFILE_USER_SERVICE_RBAC', '/updateCustomerProfileRetailo', 'POST', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (8, (SELECT id from permissions where code = 'G_CUSTOMER_USER_SERVICE_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_CUSTOMER_USER_SERVICE_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'P_UPDATE_PROFILE_USER_SERVICE_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_CUSTOMER_BY_LOCATION_USER_SERVICE_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_CUSTOMER_BY_SUPERVISOR_USER_SERVICE_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_ALL_CUSTOMERS_OR_USERS_USER_SERVICE_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_CUSTOMER_PROFILE_USER_SERVICE_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_ON_BOARD_CUSTOMER_USER_SERVICE_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_UPDATE_CUSTOMER_PORTAL_USER_SERVICE_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_CUSTOMER_PROFILE_USER_SERVICE_RBAC'), now(), now());


/* user service user apis */
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('USER_SERVICE_RBAC', 'G_USERS_BY_ROLE_USER_SERVICE_RBAC', '/byRole', 'GET', now(), now()),
    ('USER_SERVICE_RBAC', 'P_CHANGE_PASSWORD_USER_SERVICE_RBAC', '/changePassword', 'POST', now(), now()),
    ('USER_SERVICE_RBAC', 'P_UPDATE_USER_USER_SERVICE_RBAC', '/updateUser', 'POST', now(), now()),
    ('USER_SERVICE_RBAC', 'P_SIGNUP_USER_USER_SERVICE_RBAC', '/signup', 'POST', now(), now());

INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'G_USERS_BY_ROLE_USER_SERVICE_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_CHANGE_PASSWORD_USER_SERVICE_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_UPDATE_USER_USER_SERVICE_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_SIGNUP_USER_USER_SERVICE_RBAC'), now(), now());
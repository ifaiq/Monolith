/*
   SECTION 1: covering all missing api's iteration-4
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'P_UPDATE_CUSTOMER_PROFILE_RBAC', '/customer/updateCustomerProfileRetailo', 'POST', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (6, (SELECT id from permissions where code = 'P_UPDATE_CUSTOMER_PROFILE_RBAC'), now(), now());
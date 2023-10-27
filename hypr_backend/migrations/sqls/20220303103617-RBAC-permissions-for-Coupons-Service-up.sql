/*
   RBAC permissions for coupon-service routes
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('COUPON_SERVICE_RBAC', 'G_COUPONS_PORTAL', '/coupons/', 'GET', now(), now()),
    ('COUPON_SERVICE_RBAC', 'G_COUPONS', '/coupons', 'GET', now(), now()),
    ('COUPON_SERVICE_RBAC', 'G_COUPON_WALLET', '/coupons/wallet', 'GET', now(), now()),
    ('COUPON_SERVICE_RBAC', 'P_COUPONS_CREATE', '/coupons/', 'POST', now(), now()),
    ('COUPON_SERVICE_RBAC', 'U_COUPONS_APPLY', '/coupons/apply', 'PUT', now(), now()),
    ('COUPON_SERVICE_RBAC', 'U_COUPONS_UPDATE', '/coupons/', 'PUT', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
   
    (9, (SELECT id from permissions where code = 'G_COUPONS_PORTAL'), now(), now()),
    (9 ,(SELECT id from permissions where code = 'G_COUPONS'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_COUPONS_CREATE'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_COUPON_WALLET'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_COUPON_WALLET'), now(), now()),
    (8, (SELECT id from permissions where code = 'U_COUPONS_APPLY'), now(), now()),
    (16, (SELECT id from permissions where code = 'U_COUPONS_APPLY'), now(), now()),
    (8, (SELECT id from permissions where code = 'U_COUPONS_UPDATE'), now(), now()),
    (9, (SELECT id from permissions where code = 'U_COUPONS_UPDATE'), now(), now()),
    (16, (SELECT id from permissions where code = 'U_COUPONS_UPDATE'), now(), now());
    
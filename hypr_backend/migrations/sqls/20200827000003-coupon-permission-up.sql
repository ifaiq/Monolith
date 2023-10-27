INSERT INTO
    permissions (id, code, api, method, created_at, updated_at)
VALUES
    (125, 'L_COUPON', '/coupon/getALLCoupons', 'GET', now(), now()),
    (126, 'C_COUPON', '/coupon/createCoupon', 'POST', now(), now()),
    (127, 'U_COUPON', '/coupon/updateCoupon', 'POST', now(), now());
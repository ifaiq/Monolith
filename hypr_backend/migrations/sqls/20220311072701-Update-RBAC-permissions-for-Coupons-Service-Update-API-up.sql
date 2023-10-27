/* Coupon Service ALP-77 fix */

DELETE FROM role_permissions WHERE permission_id = (SELECT id from permissions where code = 'U_COUPONS_UPDATE') AND role_id IN (8, 16);
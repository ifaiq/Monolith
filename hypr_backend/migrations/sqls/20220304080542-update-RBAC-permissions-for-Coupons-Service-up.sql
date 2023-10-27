UPDATE permissions 
SET api = '/coupons/?'
WHERE 
name = 'COUPON_SERVICE_RBAC'
AND code = 'U_COUPONS_UPDATE'
AND api = '/coupons/'
AND method = 'PUT'
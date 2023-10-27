/* Removing extra GET path from RBAC */

DELETE FROM permissions WHERE code = 'G_COUPONS' AND api = '/coupons'
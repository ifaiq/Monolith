/*
   RBAC permissions for coupon-service routes
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'G_LOCATION_BY_ID_PORTAL', '/api/v1/location/portal/?', 'GET', now(), now());

INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
   
    (9, (SELECT id from permissions where code = 'G_LOCATION_BY_ID_PORTAL'), now(), now());
    
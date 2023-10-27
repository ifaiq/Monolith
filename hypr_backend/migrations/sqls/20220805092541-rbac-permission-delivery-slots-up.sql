/*
   RBAC permissions for delivery-slots routes - ALP-944
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('DELIVERY_SLOTS_RBAC', 'U_DELIVERY_SLOTS_EDIT_PORTAL', '/api/v1/delivery-slots', 'PUT', now(), now()),
    ('DELIVERY_SLOTS_RBAC', 'G_DELIVERY_SLOTS_PORTAL', '/api/v1/delivery-slots/portal', 'GET', now(), now()),
    ('DELIVERY_SLOTS_RBAC', 'G_DELIVERY_SLOTS_CONSUMER', '/api/v1/delivery-slots', 'GET', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
   
    (9,  (SELECT id from permissions where code = 'U_DELIVERY_SLOTS_EDIT_PORTAL'), now(), now()),
    (9,  (SELECT id from permissions where code = 'G_DELIVERY_SLOTS_PORTAL'), now(), now()),
    (8,  (SELECT id from permissions where code = 'G_DELIVERY_SLOTS_CONSUMER'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_DELIVERY_SLOTS_CONSUMER'), now(), now());
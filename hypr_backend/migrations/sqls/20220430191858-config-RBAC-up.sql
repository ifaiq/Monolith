/* Replace with your SQL commands */

INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('CONFIG_SERVICE_RBAC', 'G_BU_OR_LOC_FOR_PORTAL_RBAC', '/portal/?', 'GET', now(), now()),
    ('CONFIG_SERVICE_RBAC', 'P_UPDATE_LOCATION_OR_BU_RBAC', '/?', 'PUT', now(), now()),
    ('CONFIG_SERVICE_RBAC', 'P_CREATE_LOCATION_OR_BU_RBAC', '/', 'POST', now(), now()),
    ('CONFIG_SERVICE_RBAC', 'D_CREATE_OR_UPDATE_LOCATION_BANNER_RBAC', '/?/banners', 'PUT', now(), now()),
    ('CONFIG_SERVICE_RBAC', 'G_LOCATION_BANNER_RBAC', '/?/banners', 'GET', now(), now()),
    ('CONFIG_SERVICE_RBAC', 'D_LOCATION_BANNER_RBAC', '/?', 'DELETE', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'G_BU_OR_LOC_FOR_PORTAL_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_UPDATE_LOCATION_OR_BU_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_CREATE_LOCATION_OR_BU_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'D_CREATE_OR_UPDATE_LOCATION_BANNER_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_LOCATION_BANNER_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'D_LOCATION_BANNER_RBAC'), now(), now());

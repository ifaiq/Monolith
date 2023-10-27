/* Replace with your SQL commands */
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'P_CATEGORY_GET', '/api/v1/category/getCategoriesForExternalUse', 'GET', now(), now());
 
INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'P_CATEGORY_GET'), now(), now()),
    (16, (SELECT id from permissions where code = 'P_CATEGORY_GET'), now(), now());
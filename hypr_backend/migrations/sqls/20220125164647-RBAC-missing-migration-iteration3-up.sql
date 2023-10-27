/* Replace with your SQL commands */
/*
   SECTION 1: covering all missing api's iteration-3
*/
INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'P_SEND_NOTIFICATIONS_RBAC', '/notifications/sendNotificationsToRetailers', 'POST', now(), now()),
    ('RBAC', 'G_SEARCHED_PRODUCT_RBAC', '/tag/search', 'GET', now(), now());


INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'P_SEND_NOTIFICATIONS_RBAC'), now(), now()),
    (8, (SELECT id from permissions where code = 'G_SEARCHED_PRODUCT_RBAC'), now(), now()),
    (16, (SELECT id from permissions where code = 'G_SEARCHED_PRODUCT_RBAC'), now(), now()),
    (6, (SELECT id from permissions where code = 'C_IMG_S3'), now(), now()),
    (8, (SELECT id from permissions where code = 'C_IMG_S3'), now(), now()),
    (16, (SELECT id from permissions where code = 'C_IMG_S3'), now(), now());
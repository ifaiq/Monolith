/* Replace with your SQL commands */

DELETE FROM role_permissions where permission_id = (select id from permissions where code = 'P_CATEGORY_GET');
DELETE FROM permissions WHERE code IN (
    'P_CATEGORY_GET',
);
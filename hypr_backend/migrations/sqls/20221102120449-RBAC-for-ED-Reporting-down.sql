/* Replace with your SQL commands */

DELETE FROM role_permissions where permission_id = (select id from permissions where code = 'P_ED_REPORTING_CREATE');
DELETE FROM role_permissions where permission_id = (select id from permissions where code = 'P_ED_REPORTING_GET');
DELETE FROM permissions WHERE code IN (
    'P_ED_REPORTING_CREATE',
    'P_ED_REPORTING_GET'
);
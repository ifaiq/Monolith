/* Replace with your SQL commands */
DELETE FROM role_permissions
WHERE permission_id = (SELECT id from permissions where code = 'P_CUSTOMER_SKU_REPORT_RBAC');

DELETE FROM permissions 
WHERE
    code = 'P_CUSTOMER_SKU_REPORT_RBAC';
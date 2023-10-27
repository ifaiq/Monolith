DELETE FROM role_permissions 
WHERE permission_id = (SELECT id FROM permissions WHERE code = 'G_DELIVERY_SLOTS_PORTAL')
AND role_id = 9;


DELETE FROM role_permissions 
WHERE permission_id = (SELECT id FROM permissions WHERE code = 'U_DELIVERY_SLOTS_EDIT_PORTAL')
AND role_id = 9;

DELETE FROM role_permissions WHERE permission_id = (SELECT id FROM permissions WHERE code = 'BU_DPU');
DELETE FROM permissions WHERE code = 'BU_DPU';
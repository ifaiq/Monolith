INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT 9, 134, now(), now() AS tmp
WHERE NOT EXISTS (
    SELECT * FROM role_permissions WHERE role_id = 9 and permission_id = 134
);

INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT 15, 134, now(), now() AS tmp
WHERE NOT EXISTS (
    SELECT * FROM role_permissions WHERE role_id = 15 and permission_id = 134
);

INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT 7, 134, now(), now() AS tmp
WHERE NOT EXISTS (
    SELECT * FROM role_permissions WHERE role_id = 7 and permission_id = 134
);
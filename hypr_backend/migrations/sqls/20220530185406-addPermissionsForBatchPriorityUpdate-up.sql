INSERT INTO permissions (name, code, api, method, created_at, updated_at)
VALUES('BULK_DISPLAY_PRIORITY_UPDATE', 'BU_DPU', '/product/bulkUpdateProductPriorities', 'POST', now(), now());

INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'BU_DPU'), now(), now());
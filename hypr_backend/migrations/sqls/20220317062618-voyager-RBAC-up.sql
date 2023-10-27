-- Adding Voyager APIs for the following roles:
-- - Company Owner
-- - Admin

INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('RBAC', 'G_VOYAGER_TASKS_RBAC', '/routing/allTasks', 'GET', now(), now()),
    ('RBAC', 'P_VOYAGER_UPLOAD_RBAC', '/routing/upload', 'POST', now(), now()),
    ('RBAC', 'G_VOYAGER_INPUT_FILES_RBAC', '/routing/getInputFiles', 'GET', now(), now()),
    ('RBAC', 'P_VOYAGER_DOWNLOAD_LINK_RBAC', '/routing/getDownloadLink', 'POST', now(), now()),
    ('RBAC', 'P_VOYAGER_RUN_TASK_RBAC', '/routing/runTask', 'POST', now(), now()),
    ('RBAC', 'P_VOYAGER_READ_S3_STREAM_RBAC', '/routing/readS3Stream', 'POST', now(), now()),
    ('RBAC', 'P_VOYAGER_VALIDATE_DATA_RBAC', '/routing/validateData', 'POST', now(), now()),
    ('RBAC', 'P_VOYAGER_KILL_TASK_RBAC', '/routing/killTask', 'POST', now(), now()),
    ('RBAC', 'G_VOYAGER_DESC_TASK_RBAC', '/routing/describeTasks', 'POST', now(), now());

INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, (SELECT id from permissions where code = 'G_VOYAGER_TASKS_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_VOYAGER_UPLOAD_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_VOYAGER_INPUT_FILES_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_VOYAGER_DOWNLOAD_LINK_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_VOYAGER_RUN_TASK_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_VOYAGER_READ_S3_STREAM_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_VOYAGER_VALIDATE_DATA_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'P_VOYAGER_KILL_TASK_RBAC'), now(), now()),
    (9, (SELECT id from permissions where code = 'G_VOYAGER_DESC_TASK_RBAC'), now(), now()),
    (1, (SELECT id from permissions where code = 'G_VOYAGER_TASKS_RBAC'), now(), now()),
    (1, (SELECT id from permissions where code = 'P_VOYAGER_UPLOAD_RBAC'), now(), now()),
    (1, (SELECT id from permissions where code = 'G_VOYAGER_INPUT_FILES_RBAC'), now(), now()),
    (1, (SELECT id from permissions where code = 'P_VOYAGER_DOWNLOAD_LINK_RBAC'), now(), now()),
    (1, (SELECT id from permissions where code = 'P_VOYAGER_RUN_TASK_RBAC'), now(), now()),
    (1, (SELECT id from permissions where code = 'P_VOYAGER_READ_S3_STREAM_RBAC'), now(), now()),
    (1, (SELECT id from permissions where code = 'P_VOYAGER_VALIDATE_DATA_RBAC'), now(), now()),
    (1, (SELECT id from permissions where code = 'P_VOYAGER_KILL_TASK_RBAC'), now(), now()),
    (1, (SELECT id from permissions where code = 'G_VOYAGER_DESC_TASK_RBAC'), now(), now());

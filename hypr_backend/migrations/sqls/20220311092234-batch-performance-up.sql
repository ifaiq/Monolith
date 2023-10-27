/* Replace with your SQL commands */

INSERT INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('BATCH_PERF', 'G_BATCH_PERFORMANCE_RBAC', '/api/v1/batch/getBatchPerformance', 'GET', now(), now());

INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (6, (SELECT id from permissions where code = 'G_BATCH_PERFORMANCE_RBAC'), now(), now());


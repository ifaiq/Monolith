-- INSERT INTO
--     permissions (id, code, api, method, created_at, updated_at)
-- VALUES
--     (135, 'L_ALL_LOC_SIDE', '/location/getAllLocations', 'GET', now(), now());

-- INSERT INTO
--     role_permissions (id, role_id, permission_id, created_at, updated_at)
-- VALUES
--     (686, 9, 135,  now(), now()),
--     (687, 15, 135, now(), now()),
--     (688, 7, 135, now(), now()),
--     (689, 22, 135,  now(), now());
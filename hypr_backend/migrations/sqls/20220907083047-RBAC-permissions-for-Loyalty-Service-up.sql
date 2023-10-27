/*
    RBAC permissions for Loyalty service endpoints
*/
INSERT IGNORE INTO
    permissions (name, code, api, method, created_at, updated_at)
VALUES
    ('LOYALTY_SERVICE_RBAC', 'G_LOYALTY_SERVICE_PROGRAM_PROGRAM_DETAILS', '/loyalty/api/v1/program/program_details', 'GET', now(), now()),
    ('LOYALTY_SERVICE_RBAC', 'G_LOYALTY_SERVICE_AUDIO_GET_AUDIO', '/loyalty/api/v1/audio/get_audio', 'GET', now(), now()),
    ('LOYALTY_SERVICE_RBAC', 'G_LOYALTY_SERVICE_AUDIO_PLAY', '/loyalty/api/v1/audio/play', 'GET', now(), now()),
    ('LOYALTY_SERVICE_RBAC', 'G_LOYALTY_SERVICE_SETTING_GET_SETTINGS', '/loyalty/api/v1/setting', 'GET', now(), now()),
    ('LOYALTY_SERVICE_RBAC', 'U_LOYALTY_SERVICE_SETTING_UPDATE_SETTINGS', '/loyalty/api/v1/setting', 'PUT', now(), now()),
    ('LOYALTY_SERVICE_RBAC', 'G_LOYALTY_SERVICE_RULE_GET_RULES', '/loyalty/api/v1/rule', 'GET', now(), now()),
    ('LOYALTY_SERVICE_RBAC', 'G_LOYALTY_SERVICE_TERMS_CONDITIONS_GET', '/loyalty/api/v1/terms-conditions/?', 'GET', now(), now());
INSERT IGNORE INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (8,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_PROGRAM_PROGRAM_DETAILS'), now(), now()),
    (16,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_PROGRAM_PROGRAM_DETAILS'), now(), now()),
    
    (8,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_AUDIO_GET_AUDIO'), now(), now()),
    (16,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_AUDIO_GET_AUDIO'), now(), now()),
    
    (8,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_AUDIO_PLAY'), now(), now()),
    (16,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_AUDIO_PLAY'), now(), now()),
    
    (8,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_SETTING_GET_SETTINGS'), now(), now()),
    (16,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_SETTING_GET_SETTINGS'), now(), now()),
    
    (8,  (SELECT id from permissions where code = 'U_LOYALTY_SERVICE_SETTING_UPDATE_SETTINGS'), now(), now()),
    (16,  (SELECT id from permissions where code = 'U_LOYALTY_SERVICE_SETTING_UPDATE_SETTINGS'), now(), now()),
    
    (8,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_RULE_GET_RULES'), now(), now()),
    (16,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_RULE_GET_RULES'), now(), now()),
    
    (8,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_TERMS_CONDITIONS_GET'), now(), now()),
    (16,  (SELECT id from permissions where code = 'G_LOYALTY_SERVICE_TERMS_CONDITIONS_GET'), now(), now());


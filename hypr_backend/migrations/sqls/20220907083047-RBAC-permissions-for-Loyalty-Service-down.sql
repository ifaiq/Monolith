DELETE FROM permissions WHERE code IN (
    'G_LOYALTY_SERVICE_PROGRAM_PROGRAM_DETAILS',
    'G_LOYALTY_SERVICE_AUDIO_GET_AUDIO',
    'G_LOYALTY_SERVICE_AUDIO_PLAY',
    'G_LOYALTY_SERVICE_SETTING_GET_SETTINGS',
    'U_LOYALTY_SERVICE_SETTING_UPDATE_SETTINGS',
    'G_LOYALTY_SERVICE_RULE_GET_RULES',
    'G_LOYALTY_SERVICE_TERMS_CONDITIONS_GET'
);
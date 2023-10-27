/* Replace with your SQL commands */
INSERT
    IGNORE INTO permissions (code, api, method, created_at, updated_at)
VALUES
    (
        'U_BULK_SKU_DEACTIVATION_REASON_RBAC',
        '/product/bulkUpdateSkuDeactivation',
        'POST',
        now(),
        now()
    );

INSERT
    IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (
        9,
        (
            SELECT
                id
            from
                permissions
            where
                code = 'U_BULK_SKU_DEACTIVATION_REASON_RBAC'
        ),
        now(),
        now()
    );

/* Replace with your SQL commands */
INSERT
    IGNORE INTO permissions (name, code, api, method, created_at, updated_at)
VALUES
    (
        'SKU_DEACTIVATION_REASON_RBAC',
        'P_SKU_DEACTIVATION_REASON_RBAC',
        '/api/v1/sku-deactivation-reason',
        'POST',
        now(),
        now()
    );

INSERT
    IGNORE INTO permissions (name, code, api, method, created_at, updated_at)
VALUES
    (
        'SKU_DEACTIVATION_REASON_RBAC',
        'G_SKU_DEACTIVATION_REASON_RBAC',
        '/api/v1/sku-deactivation-reason',
        'GET',
        now(),
        now()
    );

INSERT
    IGNORE INTO permissions (name, code, api, method, created_at, updated_at)
VALUES
    (
        'SKU_DEACTIVATION_REASON_RBAC',
        'D_SKU_DEACTIVATION_REASON_RBAC',
        '/api/v1/sku-deactivation-reason',
        'DELETE',
        now(),
        now()
    );

INSERT
    IGNORE INTO permissions (name, code, api, method, created_at, updated_at)
VALUES
    (
        'SKU_DEACTIVATION_REASON_RBAC',
        'PU_SKU_DEACTIVATION_REASON_RBAC',
        '/api/v1/sku-deactivation-reason',
        'PUT',
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
                code = 'P_SKU_DEACTIVATION_REASON_RBAC'
        ),
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
                code = 'G_SKU_DEACTIVATION_REASON_RBAC'
        ),
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
                code = 'D_SKU_DEACTIVATION_REASON_RBAC'
        ),
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
                code = 'PU_SKU_DEACTIVATION_REASON_RBAC'
        ),
        now(),
        now()
    );
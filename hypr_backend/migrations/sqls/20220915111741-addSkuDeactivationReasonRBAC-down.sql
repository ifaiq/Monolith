DELETE FROM
    role_permissions
WHERE
    permission_id = (
        SELECT
            id
        from
            permissions
        where
            code = 'P_SKU_DEACTIVATION_REASON_RBAC'
    );

DELETE FROM
    permissions
WHERE
    code = 'P_SKU_DEACTIVATION_REASON_RBAC';


DELETE FROM
    role_permissions
WHERE
    permission_id = (
        SELECT
            id
        from
            permissions
        where
            code = 'G_SKU_DEACTIVATION_REASON_RBAC'
    );

DELETE FROM
    permissions
WHERE
    code = 'G_SKU_DEACTIVATION_REASON_RBAC';


DELETE FROM
    role_permissions
WHERE
    permission_id = (
        SELECT
            id
        from
            permissions
        where
            code = 'D_SKU_DEACTIVATION_REASON_RBAC'
    );

DELETE FROM
    permissions
WHERE
    code = 'D_SKU_DEACTIVATION_REASON_RBAC';


DELETE FROM
    role_permissions
WHERE
    permission_id = (
        SELECT
            id
        from
            permissions
        where
            code = 'PU_SKU_DEACTIVATION_REASON_RBAC'
    );

DELETE FROM
    permissions
WHERE
    code = 'PU_SKU_DEACTIVATION_REASON_RBAC';
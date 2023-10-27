DELETE FROM
    role_permissions
WHERE
    permission_id = (
        SELECT
            id
        from
            permissions
        where
            code = 'U_BULK_SKU_DEACTIVATION_REASON_RBAC'
    );

DELETE FROM
    permissions
WHERE
    code = 'U_BULK_SKU_DEACTIVATION_REASON_RBAC';

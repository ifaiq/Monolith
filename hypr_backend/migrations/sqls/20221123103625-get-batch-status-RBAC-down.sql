/*
   RBAC permissions for create spot orders API
*/
DELETE FROM role_permissions where permission_id = (select id from permissions where code = 'G_GET_BATCH_STATUS_BY_ID');

INSERT INTO
    permissions (id, code, api, method, created_at, updated_at)
VALUES
    (128,'C_NOTI_MSG',"/notifications/createMessage", "POST", NOW(), NOW()),
    (129,'U_NOTI_MSG',"/notifications/updateMessage", "PUT", NOW(), NOW()),
    (130,'R_NOTI_MSG',"/notifications/removeMessage", "POST", NOW(), NOW()),
    (131,'L_NOTI_MSG',"/notifications/getAllMessages", "GET", NOW(), NOW()),
    (132,'L_COMP_BY_APP',"/company/getCompaniesByAppId", "GET", NOW(), NOW()),
    (133,'L_RETAILERS_BY_APP',"/notifications/getRetailersByAppId", "GET", NOW(), NOW());

INSERT INTO
    role_permissions (role_id, permission_id, created_at, updated_at)
VALUES
    (9, 128, NOW(), NOW()),
    (9, 129, NOW(), NOW()),
    (9, 130, NOW(), NOW()),
    (9, 131, NOW(), NOW()),
    (9, 132, NOW(), NOW()),
    (9, 133, NOW(), NOW());



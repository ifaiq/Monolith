/* create role super agent */

INSERT INTO
    roles (id, name, disabled, created_at, updated_at)
VALUES
    (25, 'SUPER-AGENT', 0, now(), now());
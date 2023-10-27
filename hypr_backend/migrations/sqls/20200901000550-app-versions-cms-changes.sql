ALTER TABLE app_versions 
ADD COLUMN is_customer TINYINT(1) NULL DEFAULT 0 AFTER deleted_at,
ADD COLUMN app_id VARCHAR(255) NULL AFTER is_customer,
ADD COLUMN app_key VARCHAR(255) NULL AFTER app_id;

UPDATE `app_versions` SET is_customer = 1 WHERE (name in ('Hyprpay', 'Retailo')) and id>1;

INSERT INTO app_companies (app_id, company_id, created_at, updated_at)
SELECT 2, companies.id, now(), now()
FROM companies
WHERE companies.code = 'MARK';
INSERT INTO app_companies (app_id, company_id, created_at, updated_at)
SELECT 2, companies.id, now(), now()
FROM companies
WHERE companies.code = 'MONT';
INSERT INTO app_companies (app_id, company_id, created_at, updated_at)
SELECT 7, companies.id, now(), now()
FROM companies
WHERE companies.code = 'RET';

select * from app_versions;
INSERT INTO app_versions(id, name, current_version, updated_by, created_at, updated_at, deleted_at, is_customer, app_id, app_key)
values('2', 'Hyprpay', '2.5', NULL, '2020-06-16 08:31:01', '2020-06-16 08:31:01', NULL, '1', '750ddf30-a19d-4bfd-a527-1d2857191dd8', 'NTM0NjVhNDEtNTNjYi00OTNlLWJjMzktN2YxNWRlNjQwOThh'),
('4', 'Delivery', '10.5', NULL, '2020-06-16 08:31:01', '2020-06-16 08:31:01', NULL, '0', 'de106129-e03b-4f56-9b51-bba8f764a5e1', 'NGU5ZGI3MjAtMjNhMi00MGE0LTlmMjEtNzMzNjg1NGY3NGM0'
),
('5', 'Packer', '10.1', NULL, '2020-06-16 08:31:01', '2020-06-16 08:31:01', NULL, '0', 'b6e1eddf-06c4-4e30-bfa2-04664802d102', 'OGJiNWMyNTQtZTZlYy00ZTM5LTkzMjYtMzBhODllYTIyODQz'
),
('7', 'Retailo', '1.0.50', NULL, '2020-06-16 08:31:01', '2020-06-16 08:31:01', NULL, '1', '750ddf30-a19d-4bfd-a527-1d2857191dd8', 'NTM0NjVhNDEtNTNjYi00OTNlLWJjMzktN2YxNWRlNjQwOThh'
);

INSERT INTO
    app_roles (id, app_id, role_id, created_at, updated_at)
VALUES
    (1, 4, 6, now(), now()),
    (2, 5, 5, now(), now()),
    (3, 5, 7, now(), now());


UPDATE `app_versions` SET `app_id` = 'b6e1eddf-06c4-4e30-bfa2-04664802d102', `app_key` = 'OGJiNWMyNTQtZTZlYy00ZTM5LTkzMjYtMzBhODllYTIyODQz' WHERE (name = 'Packer') and id>0;
UPDATE `app_versions` SET `app_id` = 'de106129-e03b-4f56-9b51-bba8f764a5e1', `app_key` = 'NGU5ZGI3MjAtMjNhMi00MGE0LTlmMjEtNzMzNjg1NGY3NGM0' WHERE (name = 'Delivery') and id>0;
UPDATE `app_versions` SET `app_id` = '750ddf30-a19d-4bfd-a527-1d2857191dd8', `app_key` = 'NTM0NjVhNDEtNTNjYi00OTNlLWJjMzktN2YxNWRlNjQwOThh' WHERE (name in ('Hyprpay', 'Retailo')) and id>0;
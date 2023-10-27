/* Replace with your SQL commands */
INSERT INTO
    app_versions (name, current_version, is_customer, created_at, updated_at)
SELECT "Logistics", "1.4", 0, now(), now()  WHERE not exists(
Select * from app_versions as temp where name="Logistics"); 

INSERT INTO
    app_versions (name, current_version, is_customer, created_at, updated_at)
SELECT "Chase up", "1.8", 1, now(), now()  WHERE not exists(
Select * from app_versions as temp where name="Chase up"); 

ALTER TABLE `app_versions` 
ADD COLUMN `company_id` INT(11) NULL DEFAULT NULL AFTER `app_key`;

UPDATE app_versions SET company_id = (SELECT companies.id FROM companies where code = "MARK"),
app_id="750ddf30-a19d-4bfd-a527-1d2857191dd8",
app_key="NTM0NjVhNDEtNTNjYi00OTNlLWJjMzktN2YxNWRlNjQwOThh"
where name="Hyprpay";

UPDATE app_versions SET company_id = (SELECT companies.id FROM companies where code = "MARK"),
app_id="de106129-e03b-4f56-9b51-bba8f764a5e1",
app_key="NGU5ZGI3MjAtMjNhMi00MGE0LTlmMjEtNzMzNjg1NGY3NGM0"
where name="Delivery";

UPDATE app_versions SET company_id = (SELECT companies.id FROM companies where code = "MARK"),
app_id="b6e1eddf-06c4-4e30-bfa2-04664802d102",
app_key="OGJiNWMyNTQtZTZlYy00ZTM5LTkzMjYtMzBhODllYTIyODQz"
where name="Packer";

UPDATE app_versions SET company_id = (SELECT companies.id FROM companies where code = "CHASE"),
app_id="750ddf30-a19d-4bfd-a527-1d2857191dd8",
app_key="NTM0NjVhNDEtNTNjYi00OTNlLWJjMzktN2YxNWRlNjQwOThh"
where name="Chase up";

UPDATE app_versions SET company_id = (SELECT companies.id FROM companies where code = "RET"),
app_id="750ddf30-a19d-4bfd-a527-1d2857191dd8",
app_key="NTM0NjVhNDEtNTNjYi00OTNlLWJjMzktN2YxNWRlNjQwOThh"
where name="Retailo";

UPDATE app_versions SET company_id = (SELECT companies.id FROM companies where code = "RET"),
app_id="b6e1eddf-06c4-4e30-bfa2-04664802d102",
app_key="OGJiNWMyNTQtZTZlYy00ZTM5LTkzMjYtMzBhODllYTIyODQz"
where name="Logistics";

INSERT INTO
    app_versions (name, current_version, created_at, updated_at, is_customer, app_id, app_key, company_id)
VALUES
    ("Montreal", (select temp.current_version from  app_versions as temp where temp.name="hyprpay" limit 1),  now(), now(), 1, "750ddf30-a19d-4bfd-a527-1d2857191dd8", "NTM0NjVhNDEtNTNjYi00OTNlLWJjMzktN2YxNWRlNjQwOThh", (SELECT companies.id FROM companies where code = "MONT")),
	("Packer", (select temp.current_version from  app_versions as temp where temp.name="Packer"  limit 1),  now(), now(), 0, "b6e1eddf-06c4-4e30-bfa2-04664802d102", "OGJiNWMyNTQtZTZlYy00ZTM5LTkzMjYtMzBhODllYTIyODQz", (SELECT companies.id FROM companies where code = "MONT")),
    ("Delivery", (select temp.current_version from  app_versions as temp where temp.name="Delivery"  limit 1),  now(), now(), 0, "de106129-e03b-4f56-9b51-bba8f764a5e1", "NGU5ZGI3MjAtMjNhMi00MGE0LTlmMjEtNzMzNjg1NGY3NGM0", (SELECT companies.id FROM companies where code = "MONT")),
	("Packer", (select temp.current_version from  app_versions as temp where temp.name="Packer"  limit 1),  now(), now(), 0, "b6e1eddf-06c4-4e30-bfa2-04664802d102", "OGJiNWMyNTQtZTZlYy00ZTM5LTkzMjYtMzBhODllYTIyODQz", (SELECT companies.id FROM companies where code = "CHASE")),
    ("Delivery", (select temp.current_version from  app_versions as temp where temp.name="Delivery"  limit 1),  now(), now(), 0, "de106129-e03b-4f56-9b51-bba8f764a5e1", "NGU5ZGI3MjAtMjNhMi00MGE0LTlmMjEtNzMzNjg1NGY3NGM0", (SELECT companies.id FROM companies where code = "CHASE"));

INSERT INTO
    app_roles (app_id, role_id, created_at, updated_at)
SELECT app_versions.id, 5, now(), now() from app_versions where name = "packer" 
    and (select count(*) from app_roles as temp where temp.app_id=app_versions.id and temp.role_id=5)=0;

INSERT INTO
    app_roles (app_id, role_id, created_at, updated_at)
SELECT app_versions.id, 7, now(), now() from app_versions where name = "packer" 
    and (select count(*) from app_roles as temp where temp.app_id=app_versions.id and temp.role_id=7)=0;

INSERT INTO
    app_roles (app_id, role_id, created_at, updated_at)
SELECT app_versions.id, 6, now(), now() from app_versions where ( name = "Delivery" or name="Logistics")
    and (select count(*) from app_roles as temp where temp.app_id=app_versions.id and temp.role_id=6)=0;

INSERT INTO
    app_roles (app_id, role_id, created_at, updated_at)
SELECT app_versions.id, 16, now(), now() from app_versions where name = "Supervisor"
    and (select count(*) from app_roles as temp where temp.app_id=app_versions.id and temp.role_id=16)=0;

INSERT INTO
    app_versions (name, current_version, created_at, updated_at, is_customer, app_id, app_key, company_id)
VALUES
    ("Supervisor", 1.0,  now(), now(), 0, "9fdf5587-e134-423a-ae61-5f9b124bea3f", "NjMwMTU3MTItYjI1OC00NGUwLWFmOTMtNDhlNzIxMmI4Y2Rl", (SELECT companies.id FROM companies where code = "MARK")),
	("Supervisor", 1.0,  now(), now(), 0, "9fdf5587-e134-423a-ae61-5f9b124bea3f", "NjMwMTU3MTItYjI1OC00NGUwLWFmOTMtNDhlNzIxMmI4Y2Rl", (SELECT companies.id FROM companies where code = "RET"));


-- Add entry for ios in app_version table
insert into app_versions (name, current_version, updated_by, created_at, updated_at, deleted_at, is_customer, app_id, app_key, company_id, os)
select name, '1.0.0', updated_by, created_at, updated_at, deleted_at, is_customer, app_id, app_key, company_id, 'ios' from app_versions where name = 'Retailo' and os = 'android';



set @role_id_consumer =( select id from roles where name = 'CONSUMER' );
set @role_id_supervisor = ( select id from roles where name = 'SUPERVISOR');
set @current_app_version_android = (select current_version from app_versions where name = 'Retailo' and os = 'android');
set @general_app_version_id_android = (select id from app_versions where name = 'Retailo' and os = 'android');
set @current_app_version_ios = (select current_version from app_versions where name = 'Retailo' and os = 'ios');
set @general_app_version_id_ios = (select id from app_versions where name = 'Retailo' and os = 'ios');



-- Add android app minimum version for consumer
insert into roles_app_versions (role_id,os,minimum_version,general_app_version) 
values (@role_id_consumer,'android',@current_app_version_android,@general_app_version_id_android);

-- Add android app minimum version for supervisor
insert into roles_app_versions (role_id,os,minimum_version,general_app_version) 
values (@role_id_supervisor,'android',@current_app_version_android,@general_app_version_id_android);


-- Add ios app minimum version for consumer
insert into roles_app_versions (role_id,os,minimum_version,general_app_version) 
values (@role_id_consumer,'ios',@current_app_version_ios,@general_app_version_id_ios);


-- Add ios app minimum version for supervisor
insert into roles_app_versions (role_id,os,minimum_version,general_app_version) 
values (@role_id_supervisor,'ios',@current_app_version_ios,@general_app_version_id_ios);

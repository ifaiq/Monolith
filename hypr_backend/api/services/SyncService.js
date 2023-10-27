const { BigQuery } = require("@google-cloud/bigquery");
const bigquery = new BigQuery({
  keyFilename: "./config/service.json",
  projectId: "hypr-shopdev",
});

module.exports = {
  sync: async (table_name, from_date, till_date, delete_key = false) => {
    let query = "";
    if (delete_key) {
      query = `delete FROM \`hypr-shopdev.hypr_db_etl.account_events\` where company_id != ${from_date};

 delete FROM \`hypr-shopdev.hypr_db_etl.account_emails\` where company_id != ${from_date};
 
 delete FROM \`hypr-shopdev.hypr_db_etl.account_settings\` where company_id != ${from_date};
 
 delete FROM \`hypr-shopdev.hypr_db_etl.catalogue\` where company_id != ${from_date};
 
 delete FROM \`hypr-shopdev.hypr_db_etl.categories\` where location_id in ( select id from \`hypr-shopdev.hypr_db_etl.locations\` where company_id != ${from_date});
 
 delete FROM \`hypr-shopdev.hypr_db_etl.companies\` where id != ${from_date};
 
 delete FROM \`hypr-shopdev.hypr_db_etl.customer_addresses\` where customer_id in (select id FROM \`hypr-shopdev.hypr_db_etl.customers\` where company_id != ${from_date});
 
 delete FROM \`hypr-shopdev.hypr_db_etl.customer_retailer_locations\` where customer_id in (select id FROM \`hypr-shopdev.hypr_db_etl.customers\` where company_id != ${from_date});
 
 delete FROM \`hypr-shopdev.hypr_db_etl.customer_retailer_shop_details\` where customer_id in (select id FROM \`hypr-shopdev.hypr_db_etl.customers\` where company_id != ${from_date});
 
 delete FROM \`hypr-shopdev.hypr_db_etl.user_notifications\` where customer_id in (select id FROM \`hypr-shopdev.hypr_db_etl.customers\` where company_id != ${from_date});
 
 delete FROM \`hypr-shopdev.hypr_db_etl.user_roles\` where customer_id in (select id FROM \`hypr-shopdev.hypr_db_etl.customers\` where company_id != ${from_date});
 
 delete FROM \`hypr-shopdev.hypr_db_etl.user_notifications\` where customer_id in (select id FROM \`hypr-shopdev.hypr_db_etl.customers\` where company_id != ${from_date});
 
 delete FROM \`hypr-shopdev.hypr_db_etl.customers\` where company_id != ${from_date};
 
 delete FROM \`hypr-shopdev.hypr_db_etl.order_items\` where order_id in (select id FROM \`hypr-shopdev.hypr_db_etl.orders\` where location_id in (select id FROM \`hypr-shopdev.hypr_db_etl.locations\` where company_id != ${from_date}));
 
 delete FROM \`hypr-shopdev.hypr_db_etl.order_history\` where order_id in (select id FROM \`hypr-shopdev.hypr_db_etl.orders\` where location_id in (select id FROM \`hypr-shopdev.hypr_db_etl.locations\` where company_id != ${from_date}));
 
 delete FROM \`hypr-shopdev.hypr_db_etl.orders\` where location_id in (select id FROM \`hypr-shopdev.hypr_db_etl.locations\` where company_id != ${from_date});
 
 delete FROM \`hypr-shopdev.hypr_db_etl.products\` where location_id in (select id FROM \`hypr-shopdev.hypr_db_etl.locations\` where company_id != ${from_date});
 
 delete from \`hypr-shopdev.hypr_db_etl.user_notifications\` where user_id in (select user_id from \`hypr-shopdev.hypr_db_etl.auth_store\` where company_id!=${from_date} or business_unit_id in (SELECT id FROM \`hypr-shopdev.hypr_db_etl.business_units\` where company_id != ${from_date} ) or location_id in (SELECT id FROM \`hypr-shopdev.hypr_db_etl.locations\` where company_id != ${from_date}));
 
 delete from \`hypr-shopdev.hypr_db_etl.user_roles\` where user_id in (select user_id from \`hypr-shopdev.hypr_db_etl.auth_store\` where company_id!=${from_date} or business_unit_id in (SELECT id FROM \`hypr-shopdev.hypr_db_etl.business_units\` where company_id != ${from_date} ) or location_id in (SELECT id FROM \`hypr-shopdev.hypr_db_etl.locations\` where company_id != ${from_date})); 
 
 delete from \`hypr-shopdev.hypr_db_etl.users\` where id in (select user_id from \`hypr-shopdev.hypr_db_etl.auth_store\` where company_id!=${from_date} or business_unit_id in (SELECT id FROM \`hypr-shopdev.hypr_db_etl.business_units\` where company_id != ${from_date} ) or location_id in (SELECT id FROM \`hypr-shopdev.hypr_db_etl.locations\` where company_id != ${from_date})); 

 delete from \`hypr-shopdev.hypr_db_etl.coupons\` where company_id!=${from_date}; 

 delete from \`hypr-shopdev.hypr_db_etl.coupon_usage_history\` where coupon_id in (select id from \`hypr-shopdev.hypr_db_etl.coupons\` where company_id!=${from_date};

 delete from \`hypr-shopdev.hypr_db_etl.coupon_customers\` where coupon_id in (select id from \`hypr-shopdev.hypr_db_etl.coupons\` where company_id!=${from_date};

 delete from \`hypr-shopdev.hypr_db_etl.locations\` where company_id != ${from_date}`;
    } else {
      let status_condition = "";
      if (table_name == "orders") status_condition = " and status_id > 1";
      if (table_name == "order_items") {
        query = `delete from \`hypr-shopdev.hypr_db_etl.${table_name}\` where id in (SELECT id FROM EXTERNAL_QUERY("hypr-shopdev.us.hypr-live", "SELECT id FROM hypr_new_arch_live.${table_name} where updated_at >= '${from_date}' and updated_at <='${till_date}';"));
      INSERT INTO \`hypr-shopdev.hypr_db_etl.${table_name}\`  SELECT * FROM EXTERNAL_QUERY("hypr-shopdev.us.hypr-live", "SELECT order_items.* FROM hypr_new_arch_live.${table_name} join hypr_new_arch_live.orders on orders.id = order_items.order_id where order_items.updated_at >= '${from_date}' and order_items.updated_at <='${till_date}' and orders.status_id > 1 ;")`;
      } else {
        query = `delete from \`hypr-shopdev.hypr_db_etl.${table_name}\` where id in (SELECT id FROM EXTERNAL_QUERY("hypr-shopdev.us.hypr-live", "SELECT id FROM hypr_new_arch_live.${table_name} where updated_at >= '${from_date}' and updated_at <='${till_date}';"));
      INSERT INTO \`hypr-shopdev.hypr_db_etl.${table_name}\`  SELECT * FROM EXTERNAL_QUERY("hypr-shopdev.us.hypr-live", "SELECT * FROM hypr_new_arch_live.${table_name} where updated_at >= '${from_date}' and updated_at <='${till_date}' ${status_condition} ;")`;
      }
    }

    const options = {
      query: query,
      location: "US",
    };

    const [job] = await bigquery.createQueryJob(options);
    await job.getQueryResults();
    sails.log.info(
      `Sync Job started: ${job.id}, options: ${JSON.stringify(options)}`
    );
  },
  // [NOTE]: DEPRECATED SERVICE FUNCTION
  saveLastSync: async function () {
    return new Promise(async function (resolve, reject) {
      try {
        let company = await Companies.find({
          re_dash: true,
        });
        let company_id = company.map(function (comp) {
          return comp.id;
        });
        let settings_data = await AccountSettings.find({
          company_id: company_id,
        });
        let till_date = new Date();
        if (settings_data.length > 0) {
          let last_sync = new Date(settings_data[0].last_sync).toISOString();
          let now = new Date().toISOString();
          sails.log(
            `Sync for companyID: ${company_id} Last sync: ${last_sync} Now: ${now}`
          );
        }
        settings_data.map(async (setting) => {
          await SyncService.sync(
            "account_emails",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "account_events",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "account_settings",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "app_types",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "app_versions",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "auth_store",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "business_units",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "catalogue",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "catalogue_products",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "categories",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "city_areas",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "companies",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "customers",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "customer_addresses",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "customer_retailer_locations",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "customer_retailer_shop_details",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "customer_retailer_shop_types",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "event_types",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "inventory_job_feeds",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "locations",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "orders",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "order_history",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "order_items",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "order_status_reason",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "order_statuses",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "permissions",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "pre_order_reserve",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "products",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "product_audit_history",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "product_categories_junction",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "role_permissions",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "roles",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "shipment_methods",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "status_taxonomy",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "store_events_timing",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "store_operating_days",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "users",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "user_notifications",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "user_roles",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "week_days",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "coupons",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "coupon_usage_history",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync(
            "coupon_customers",
            new Date(setting.last_sync).toISOString(),
            till_date.toISOString()
          );
          await SyncService.sync("week_days", setting.company_id, "", true);
        });
        let account = await AccountSettings.update(
          { company_id: company_id },
          { last_sync: till_date }
        );
        resolve(account);
      } catch (err) {
        reject(err);
      }
    });
  },
};

/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
 require("dotenv").config();
 const { NEW_RELIC_APP_NAME, NEW_RELIC_LICENSE_KEY, NEW_RELIC_LOG_LEVEL, NEW_RELIC_LOG_ENABLED, NEW_RELIC_LOG_File_PATH } = process.env;


 exports.config = {
   
    /**
    * Array of application names.
    */
     app_name: NEW_RELIC_APP_NAME || "backend_api", 
     /**
    * Your New Relic license key.
    */
     license_key: NEW_RELIC_LICENSE_KEY || "eu01xx09xxxxxxxx",
     
     logging: {
     /**
      * Level at which to log. 'trace' is most useful to New Relic when diagnosing
      * issues with the agent, 'info' and higher will impose the least overhead on
      * production applications.
      */
       level: NEW_RELIC_LOG_LEVEL || "info",

   //  Enables or disables agent specific logging.
       enabled: NEW_RELIC_LOG_ENABLED || "true",
   
   //  To write all logging to stdout, set this to stdout and to write all logging to stderr, set this to stderr.
       filepath: NEW_RELIC_LOG_File_PATH || "stdout"
     
   }
}

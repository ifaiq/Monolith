/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

requestLogFormat = "[ :date[web] ] [ :method :url ]  |  status[ :status ] response_content_length[ :res[content-length] ]  |  origin_addr[ :remote-addr ] remote_user[ :remote-user ] origin_URI[ :referrer ] origin_agent[ :user-agent ]  |  Metadata: app_version[ :req[app_version] ] build_env[ :req[build_env] ] device_brand[ :req[device_brand] ] device_model[ :req[device_model] ] device_id[ :req[device_id] ] device_OS[ :req[os] ] device_OS_version[ :req[os_version] ] request_id[ :req[request_id] ]  |  TimeToRes[ :total-time ms ] |  user_type[ :req[user_type] ] |  user_id[ :req[user_id] ]";


module.exports.http = {
  /** **************************************************************************
   *                                                                           *
   * Sails/Express middleware to run for every HTTP request.                   *
   * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
   *                                                                           *
   * https://sailsjs.com/documentation/concepts/middleware                     *
   *                                                                           *
   ****************************************************************************/

  middleware: {
    passportInit: require("passport").initialize(),
    passportSession: require("passport").session(),
    myRequestLogger: require("morgan")(requestLogFormat, {
      stream: { write: msg => sails.log.info(msg) },
    }),
    /** *************************************************************************
     *                                                                          *
     * The order in which middleware should be run for HTTP requests.           *
     * (This Sails app's routes are handled by the "router" middleware below.)  *
     *                                                                          *
     ***************************************************************************/

    order: [
      "cookieParser",
      "session",
      "passportInit",
      "passportSession",
      "bodyParser",
      "myRequestLogger",
      "compress",
      "poweredBy",
      "router",
      "www",
      "favicon",
    ],
    // Our old request logger

    // myRequestLogger: function (req, res, next) {
    //   req.received_at = new Date();
    //   sails.log.info(
    //     "Requested :: " + req.method,
    //     req.url + " @ " + req.received_at
    //   );
    //   sails.log.info("req.query", req.query);
    //   sails.log.info("req.body", req.body);
    //   return next();
    // },
    /** *************************************************************************
     *                                                                          *
     * The body parser that will handle incoming multipart HTTP requests.       *
     *                                                                          *
     * https://sailsjs.com/config/http#?customizing-the-body-parser             *
     *                                                                          *
     ***************************************************************************/
    bodyParser: (function _configureBodyParser() {
      const skipper = require("skipper");
      const middlewareFn = skipper({
        strict: true, maxTimeToBuffer: 100000,
      });
      return middlewareFn;
    })(),
  },
};
module.exports.bootstrap = function () {
  sails.hooks.http.server.keepAliveTimeout = 65 * 1000;
  sails.hooks.http.server.headersTimeout = 67 * 1000;
};

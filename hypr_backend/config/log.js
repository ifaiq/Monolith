/**
 * Built-in Log Configuration
 * (sails.config.log)
 *
 * Configure the log level for your app, as well as the transport
 * (Underneath the covers, Sails uses Winston for logging, which
 * allows for some pretty neat custom transports/adapters for log messages)
 *
 * For more information on the Sails logger, check out:
 * https://sailsjs.com/docs/concepts/logging
 */
var winston = require('winston');
var DailyRotateFile = require('winston-daily-rotate-file');
var fs = require('fs');
var format = winston.format;
var { combine, timestamp, prettyPrint } = format;

const env = process.env.NODE_ENV || 'development';
const logDir = 'logs';
if(!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const dailyRotateFileTransport = new DailyRotateFile({
    filename: `${logDir}/%DATE%-results.log`,
    datePattern: 'YYYY-MM-DD-HH',
    maxSize: '20m',
    zippedArchive: true,
    level: 'debug' // logging level for this transport 
  })

var logger = winston.createLogger({
  level: 'silly',  // Use this logger only if the log level is below this one, e.g. if it is specified 'info', this logger will be used for info, warn, error level logs
  format: combine(
    format.uncolorize(),
    format.timestamp(),
    prettyPrint(),
    // format.json(),
    // format.colorize(),
  ),  
  //defaultMeta: {'<< any service name >>'},
  transports: [
    new (winston.transports.Console)({
      level: 'debug', // only logs at this level or above would be sent to this transport
      // json: true,
      // colorize: true
    }),
    dailyRotateFileTransport,
    // new (winston.transports.File)({
    //   filename: 'logfile.log',
    //   level: 'info',
    //   json: true,
    //   colorize: false
    // })
  ]
});

module.exports.log = {
  // level: 'debug',
  // colorize: true,
  custom: logger,
  logFile: dailyRotateFileTransport
  /***************************************************************************
  *                                                                          *
  * Valid `level` configs: i.e. the minimum log level to capture with        *
  * sails.log.*()                                                            *
  *                                                                          *
  * The order of precedence for log levels from lowest to highest is:        *
  * silly, verbose, info, debug, warn, error                                 *
  *                                                                          *
  * You may also set the level to "silent" to suppress all logs.             *
  *                                                                          *
  ***************************************************************************/

  // level: 'info'

};


// let MyPerfectInfoLog = {

//   timestamp: '(UTC time)',
  
//   level: 'Info (log level)',

//   reqId: '(reqId which triggered this log)',

//   userId: '(userId or clientId which triggered this log)',

//   context: '(context of this log, e.g. the route which caused this log or a service or a routine task which invoked it)',

//   message: '(log body)'

// };

// let MyPerfectErrorLog = {

//   timestamp: '(UTC time)',
  
//   level: 'Error (log level)',

//   reqId: '(reqId which triggered this log)',

//   userId: '(userId or clientId which triggered this log)',

//   context: '(context of this log, e.g. the route which caused this log or a service or a routine task which invoked it)',

//   message: '(log body)',

//   errorStack: '(Error stack from Node / better implementation)'

// };


// let MyPerfectWarnLog = {

//   timestamp: '(UTC time)',
  
//   level: 'Warn (log level)',

//   reqId: '(reqId which triggered this log)',

//   userId: '(userId or clientId which triggered this log)',

//   context: '(context of this log, e.g. the route which caused this log or a service or a routine task which invoked it)',

//   message: '(log body)'

// }



// // e.g. log the data being processed, devs can also do things here
// let MyPerfectDebugLog = {

//   timestamp: '(UTC time)',
  
//   level: 'Debug (log level)',

//   reqId: '(reqId which triggered this log)',

//   userId: '(userId or clientId which triggered this log)',

//   context: '(context of this, e.g. the route which caused this log or a service or a routine task which invoked it)',

//   message: '(log body)'

// }



// // Developer crap goes here if any
// let myPerfectSillyLog = {

//   timestamp: '(UTC time)',
  
//   level: 'Silly (log level)',

//   reqId: '(reqId which triggered this log)',

//   userId: '(userId or clientId which triggered this log)',

//   context: '(context of this, e.g. the route which caused this log or a service or a routine task which invoked it)',

//   message: '(log body)'

// }




// let myPerfectRequestLog = {

//   OurFormat: '[:date[clf]] | [:method :url] status[:status] | response[:res] [content-length] TimeToRes[:total-time ms] | OriginAddr[:remote-addr] OriginUser[:remote-user] OriginURI[:referrer] OriginAgent[:user-agent]',

//   Example: ''
// }


// requset

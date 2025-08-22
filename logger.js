const pino = require('pino');
const path = require('path');

const DEFAULT_LOG_LEVEL = 'debug'; // Default log level

const pinoTransport = pino.transport({
    targets: [
        {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                levelFirst: true,
                singleLine: true,
                messageFormat: '{msg}',
                level: DEFAULT_LOG_LEVEL, // Set the log level to debug
                minimumLevel: DEFAULT_LOG_LEVEL, // Set the log level to debug
            },
        },
        {
            target: 'pino/file',
            options: {
                destination: path.join(__dirname, `app.log`),
                mkdir: true,
                append: true,
                level: DEFAULT_LOG_LEVEL,
                minimumLevel: DEFAULT_LOG_LEVEL, // Set the log level to debug
            }
        },
        {
            target: '@logtail/pino',
            options: { 
                sourceToken: 'nC9ECehHxhoWLH5KTUaiZmaA',
                options: { endpoint: 'https://s1448634.eu-nbg-2.betterstackdata.com' },
                level: DEFAULT_LOG_LEVEL, // Set the log level to debug
                minimumLevel: DEFAULT_LOG_LEVEL, // Set the log level to debug
            },
        },
    ]
});

console.log("Pino Log Level: " + (process.env.PINO_LOG_LEVEL || DEFAULT_LOG_LEVEL));

const logger = pino({
        level: process.env.PINO_LOG_LEVEL || DEFAULT_LOG_LEVEL,
        formatters: {
            level: (label) => {
            return { level: label.toUpperCase() };
            },
        },
    },
  pinoTransport
);



/*const consoleTransport = pino.transport({
    target: 'pino-pretty',
        level: "debug",
    options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        levelFirst: true,
        singleLine: true,
        messageFormat: '{msg}',
    }
});

const fileTransport = pino.transport({
    target: 'pino/file',
        level: "debug",
    options: {
        destination: path.join(__dirname, `app.log`),
        mkdir: true,
        append: true,
    }
});

const betterStackTransport = pino.transport({
    target: '@logtail/pino',
    options: { 
        level: "debug",
        sourceToken: 'nC9ECehHxhoWLH5KTUaiZmaA',
        options: { endpoint: 'https://s1448634.eu-nbg-2.betterstackdata.com' }
    },
});*/

//const logger = pino({
  //level: process.env.PINO_LOG_LEVEL || 'trace',
//  level: DEFAULT_LOG_LEVEL,
  /*formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },*/
//},
//pinoTransport);
//pinoTransport)





//This one works but only for console
/*
 const pretty = require('pino-pretty');
// Create a pretty stream
    const prettyStream = pretty({
        colorize: true, // Enable colorized output
        level: 'debug'
    });

    // Create the logger, piping output to the pretty stream
    const logger = pino({
        // Pino options (e.g., level)
        level: 'debug'
    }, prettyStream);

*/

module.exports = logger;
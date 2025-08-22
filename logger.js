const pino = require('pino');
const path = require('path');

const DEFAULT_LOG_LEVEL = 'debug'; // Default log level

const logger = pino({
    mixin(_context, level) {
        return { 'level-label': logger.levels.labels[level] }
    },
    transports: {
        targets: [
            {
                target: 'pino-pretty',
                level: DEFAULT_LOG_LEVEL,
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname,level-label',
                    levelFirst: true,
                    singleLine: true,
                    messageFormat: '{msg}',
                }
            },
            {
                target: 'pino/file',
                level: DEFAULT_LOG_LEVEL,
                options: {
                    destination: path.join(__dirname, `app.log`),
                    mkdir: true,
                    append: true,
                }
            },
            {
                target: '@logtail/pino',
                options: { 
                    level: DEFAULT_LOG_LEVEL,
                    sourceToken: 'nC9ECehHxhoWLH5KTUaiZmaA',
                    options: { endpoint: 'https://s1448634.eu-nbg-2.betterstackdata.com' }
                },
            }
        ]
    },
    timestamp: pino.stdTimeFunctions.isoTime
});

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
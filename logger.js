const pino = require('pino');
const path = require('path');

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
            },
        },
        {
            target: 'pino/file',
            options: {
                destination: path.join(__dirname, `app.log`),
                mkdir: true,
                append: true,
            }
        },
        {
            target: '@logtail/pino',
            options: { 
                sourceToken: 'nC9ECehHxhoWLH5KTUaiZmaA',
                options: { endpoint: 'https://s1448634.eu-nbg-2.betterstackdata.com' }
            },
        },
    ]
});

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

const logger = pino({
  //level: process.env.PINO_LOG_LEVEL || 'trace',
  level: 'trace',
  /*formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },*/
},
pinoTransport);
//pinoTransport)




module.exports = logger;
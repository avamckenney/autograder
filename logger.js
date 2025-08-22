const pino = require('pino');
const path = require('path');
const pinoHttp = require('pino-http');
const DEFAULT_LOG_LEVEL = 'debug'; // Default log level


const transport = pino.transport({
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
});

// ---- Custom serializers ----
const reqSerializer = (req) => {
  const s = pino.stdSerializers.req(req);
  if (s && s.headers) {
    delete s.headers.cookie;
  }
  return s;
};

const resSerializer = (res) => {
  const s = pino.stdSerializers.res(res);
  if (s && s.headers) {
    delete s.headers['set-cookie'];
  }
  return s;
};

const logger = pino(
  {
    level: 'debug',
    serializers: {
      ...pino.stdSerializers,
      req: reqSerializer,
      res: resSerializer
    }
  },
  transport
);

const httpLogger = pinoHttp({
  logger,
  serializers: {
    ...pino.stdSerializers,
    req: reqSerializer,
    res: resSerializer
  }
});

logger.debug("test debug");
logger.info("test info");
logger.error("test error");
logger.trace("test trace");


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

module.exports = {logger, httpLogger};
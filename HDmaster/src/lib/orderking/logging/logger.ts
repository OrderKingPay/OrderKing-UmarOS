import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

export const systemLogger = winston.createLogger({
  level: 'info',
  levels: winston.config.syslog.levels,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      level: 'debug'
    }),
    new winston.transports.File({
      filename: 'logs/system.log',
      level: 'info'
    })
  ]
});

import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
    ),
    transports: [
        new transports.Console(),
        new transports.DailyRotateFile({
            level: 'info',
            dirname: 'logs',
            filename: '%DATE%.log',
            datePattern: 'YYYY-MM-DD',
        }),
    ],
});

export default logger;

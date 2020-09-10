const { createLogger, transports, format } = require('winston')
require('winston-daily-rotate-file')
const path = require('path')

const logFolder = path.join(__dirname + '/../logs/')

const customFormat = format.combine(   
    format.errors({ stack : true }), 
    format.splat(),
    format.timestamp({
        format : 'YYYY-MM-DD HH:mm:ss'
    }),
    format.align(),
    format.printf(info => {
        if(info.stack) return `[${info.level}][${info.timestamp}] ${info.message} \n${info.stack}`

        return `[${info.level}][${info.timestamp}] ${info.message}`
    })
)

const combinedLogsTransporter = new (transports.DailyRotateFile)({
    name : 'ALL logs',
    level : 'silly',
    datePattern : 'YYYY-MM-DD',
    zippedArchive : true,
    filename : '%DATE%.log',
    dirname : logFolder + 'CombinedLogs/',
    maxSize : '500m',
    maxFiles : '10d',
    utc : true
})

const infosErrorsLogsTransporter = new (transports.DailyRotateFile)({
    name : 'Infos and Errors',
    level : 'info',
    datePattern : 'YYYY-MM-DD',
    zippedArchive : true,
    filename : '%DATE%.log',
    dirname : logFolder + 'InfosAndErrors/',
    maxSize : '100m',
    maxFiles : '31d',
    utc : true
})

const logger = createLogger({
    format : customFormat,
    transports : [
        combinedLogsTransporter,
        infosErrorsLogsTransporter
    ],
    exceptionHandlers : [
        infosErrorsLogsTransporter
    ],
    exitOnError : false
})

if(process.env.ENV === 'development') {
    logger.add(new transports.Console({
        level : 'silly',
        format : format.combine(
            format.colorize(),
            customFormat
        )
    }))
}



module.exports = logger
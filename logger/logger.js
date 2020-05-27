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

const transporter = new (transports.DailyRotateFile)({
    name : 'ALL logs',
    level : 'silly',
    datePattern : 'YYYY-MM-DD',
    zippedArchive : true,
    filename : '%DATE%.log',
    dirname : logFolder,
    maxSize : '500m',
    maxFiles : '10d',
    utc : true
})

const logger = createLogger({
    format : customFormat,
    transports : [transporter],
    exceptionHandlers : [
        transporter
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
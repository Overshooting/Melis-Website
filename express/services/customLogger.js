const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');
const timeOptions = {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
};

const dateAndTime = new Date().toLocaleString('en-US', timeOptions).replace(/:/g, '-').replace(/, /g, '_').replace(/\//g, '-');

let logType = path.basename(process.argv[1], '.js') === 'main' ? 'server' : path.basename(process.argv[1], '.js').toLowerCase();

const logDir = logType === 'server' ? path.join(__dirname, '../../server_logs') : path.join(__dirname, '../../script_logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logStream = fs.createWriteStream(
  path.join(logDir, `${logType}-${dateAndTime}.log`),
  { flags: 'a' }
);

const msgOnlyFilter = new Writable({
    write(chunk, encoding, callback) {
    try { 
        const logEntry = JSON.parse(chunk.toString()).msg;

        const statusCheck = logEntry.indexOf(' Status ') > 0 ? logEntry.substring(logEntry.indexOf(' Status ') + 8, logEntry.indexOf(' Status ') + 11) : null;
        const statusCode = statusCheck ? Math.trunc(parseInt(statusCheck, 10) / 100) : 0;
        let logTypeString = '';

        switch (statusCode) {
            case 3:
                logTypeString = '[REDIRECT]';
                break;
            case 4:
                logTypeString = '[CLIENT ERROR]';
                break;
            case 5:
                logTypeString = '[SERVER ERROR]';
                break;
            case 2:
                logTypeString = '[SUCCESS]';
                break;
            case 1:
                logTypeString = '[INFORMATION]';
                break;
        }

        const thisDate = new Date().toLocaleString('en-US', timeOptions).replace(/:/g, '-').replace(/, /g, '_').replace(/\//g, '-');

        logStream.write(`${thisDate}: ${logTypeString} ${logEntry}\n`);
        callback();
    } catch (err) {
        callback(err);
    }
}});


const logger = pino({
        level: process.env.LOG_LEVEL || 'info',
        timestamp: () => `,"time":"${new Date().toLocaleString('en-US', timeOptions).replace(/:/g, '-').replace(/, /g, '_').replace(/\//g, '-')}"`,
    },
msgOnlyFilter);

module.exports = logger;
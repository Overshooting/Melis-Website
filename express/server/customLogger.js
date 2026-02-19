const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');
const dateAndTime = new Date().toISOString().replace(/:/g, '-');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logStream = fs.createWriteStream(
  path.join(logDir, `app-${dateAndTime}.log`),
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
            case 6:
                logTypeString = '[SQL SUCCESS]';
                break;
            case 7:
                logTypeString = '[SECURITY DANGER]';
                break;
        }


        logStream.write(`${new Date().toISOString()}: ${logTypeString} ${logEntry}\n`);
        callback();
    } catch (err) {
        callback(err);
    }
}});


const logger = pino({
        level: process.env.LOG_LEVEL || 'info',
        timestamp: () => `,"time":"${new Date().toISOString()}"`,
    },
msgOnlyFilter);

module.exports = logger;
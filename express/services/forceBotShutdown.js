const fs = require('fs');
const path = require('path');
const {shutdownBot} = require('./discordBot');
const { logger } = require('./customLogger');
require('dotenv').config();

const BOT_PID_FILE = path.join(__dirname, '../../server_logs/discord-bot.pid');

function readRunningBotPid() {
    try {
        if (!fs.existsSync(BOT_PID_FILE)) {
            return null;
        }

        const rawPid = fs.readFileSync(BOT_PID_FILE, 'utf8').trim();
        const pid = Number.parseInt(rawPid, 10);
        return Number.isInteger(pid) && pid > 0 ? pid : null;
    } catch (error) {
        logger.error(error, 'Failed to read Discord bot PID file:');
        return null;
    }
}

async function forceBotShutdown() {
    try {
        logger.info("Attempting to shut down the bot...");
        console.log("Attempting to shut down the bot...");

        const botPid = readRunningBotPid();

        if (!botPid) {
            logger.info('No running bot PID found. Falling back to local shutdown.');
            await shutdownBot();
            return;
        }

        try {
            process.kill(botPid, 'SIGTERM');
            logger.info(`Sent SIGTERM to running bot process ${botPid}.`);
            console.log(`Sent SIGTERM to running bot process ${botPid}.`);
        } catch (error) {
            if (error.code === 'ESRCH') {
                logger.info(`Bot PID ${botPid} is stale. Removing PID file.`);
                try {
                    fs.unlinkSync(BOT_PID_FILE);
                } catch (unlinkError) {
                    logger.error(unlinkError, 'Failed to remove stale bot PID file:');
                }
                return;
            }

            logger.error(error, `Failed to signal bot process ${botPid}:`);
            throw error;
        }
    } catch (error) {
        logger.error(error, "Error shutting down bot:");
        console.log("Error shutting down bot:", error);
    } finally {
        logger.info("Exiting process.");
        console.log("Exiting process.");
        process.exitCode = 0;
    }
}

forceBotShutdown();
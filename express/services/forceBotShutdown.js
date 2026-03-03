const {shutdownBot} = require('./discordBot');
const logger = require('./customLogger');
require('dotenv').config();

async function forceBotShutdown() {
    try {
        logger.info("Attempting to shut down the bot...");
        console.log("Attempting to shut down the bot...");
        await shutdownBot();
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
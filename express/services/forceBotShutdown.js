const {shutdownBot} = require('./discordBot');
require('dotenv').config();

async function forceBotShutdown() {
    try {
        console.log("Attempting to shut down the bot...");
        await shutdownBot();
        console.log("Bot shutdown successfully.");
    } catch (error) {
        console.log("Error shutting down bot:", error);
    } finally {
        console.log("Exiting process.");
        process.exit(0);
    }
}

forceBotShutdown();
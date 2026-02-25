const logger = require('./customLogger');
const {initBot, sendDevMessage} = require('./discordBot');
require ('dotenv').config();

const message = process.argv[2] || null;

async function sendMessage() {
    if (!message) {
        logger.info("No message provided in sendDevMessage call.");
        process.exit(0);
    }

    try {
        await initBot();
    } catch (err) {
        logger.info("Failed to initialize Discord bot:", err);
        process.exit(1);
    }
    
    try {
        await sendDevMessage(message);
        logger.info("Message sent successfully.");
        process.exit(0);
    } catch (err) {
        logger.info("Failed to send message: ", err);
    }
}

sendMessage();
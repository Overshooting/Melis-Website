const {initBot, resetAllChannels, resetChannel, shutdownBot} = require('./discordBot');
const { logger } = require('./customLogger');
require('dotenv').config();

async function resetBotChannels() {
    const args = process.argv.slice(2).filter(Boolean);
    let exitCode = 0;

    try {
        await initBot();
    } catch (error) {
        console.log('Failed to initialize Discord bot:', error);
        logger.error(error, 'Failed to initialize Discord bot:');
        exitCode = 1;
        return;
    }

    try {
        if (args.length === 0) {
            console.log('Please provide at least one channel name or "a" to reset all channels.');
            logger.info('No channel name provided for reset. Exiting.');
            exitCode = 1;
            return;
        }

        if (args.length === 1 && (args[0] === 'a' || args[0] === 'all')) {
            console.log('Resetting all channels...');
            logger.info('Resetting all channels...');
            await resetAllChannels();
            return;
        }

        for (const channelName of args) {
            if (channelName === 'a' || channelName === 'all') {
                continue;
            }

            console.log(`Resetting channel: ${channelName}`);
            logger.info(`Resetting channel: ${channelName}`);
            await resetChannel(channelName);
        }
    } catch (error) {
        logger.error(error, 'Error resetting channels:');
        exitCode = 1;
    } finally {
        logger.info('Channel reset process complete. Shutting down bot...');
        console.log('Channel reset process complete. Shutting down bot...');
        await shutdownBot();
        process.exitCode = exitCode;
    }
}

resetBotChannels();

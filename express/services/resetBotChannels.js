const {initBot, resetAllChannels, resetChannel, shutdownBot} = require('./discordBot');
require('dotenv').config();

async function resetBotChannels() {
    try {
        await initBot();
    } catch (error) {
        console.log('Failed to initialize Discord bot:', error);
        logger.error(error, 'Failed to initialize Discord bot:');
        return;
    }

    try {
        if (process.argv[2] === 'a') {
            console.log('Resetting all channels...');
            logger.info('Resetting all channels...');
            await resetAllChannels();
            return;
        } else {
            const channelName = process.argv[2];
            if (!channelName) {
                console.log('Please provide a channel name to reset or "a" to reset all channels.');
                logger.info('No channel name provided for reset. Exiting.');
                return;
            }

            await resetChannel(channelName);
            return;
        }
    } catch (error) {
        logger.error(error, 'Error resetting channels:');
    } finally {
        logger.info('Channel reset process complete. Shutting down bot...');
        console.log('Channel reset process complete. Shutting down bot...');
        await shutdownBot();
        process.exitCode = 0;
    }
}

resetBotChannels();

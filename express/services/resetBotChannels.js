const {initBot, resetAllChannels, resetChannel, shutdownBot} = require('./discordBot');
require('dotenv').config();

async function resetBotChannels() {
    try {
        await initBot();
    } catch (error) {
        console.log('Failed to initialize Discord bot:', error);
        return;
    }

    try {
        if (process.argv[2] === 'a') {
            await resetAllChannels();
            return;
        } else {
            const channelName = process.argv[2];
            if (!channelName) {
                console.log('Please provide a channel name to reset or "a" to reset all channels.');
                return;
            }

            await resetChannel(channelName);
            return;
        }
    } catch (error) {
        console.log('Error resetting channels:', error);
    } finally {
        console.log('Channel reset process complete. Shutting down bot...');
        await shutdownBot();
    }
}

resetBotChannels();

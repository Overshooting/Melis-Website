const {
    Client,
    Intents,
    Permissions,
    MessageEmbed,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logger } = require('../services/customLogger');
require('dotenv').config();

const BOT_PID_FILE = path.join(__dirname, '../../server_logs/discord-bot.pid');

const BotChannels = Object.freeze({
    SERVER_STATUS: process.env.SERVER_STATUS_CHANNEL_NAME,
    SERVER_DEV_MESSAGES: process.env.SERVER_DEV_MESSAGES_CHANNEL_NAME,
    SERVER_SUGGESTIONS: process.env.SERVER_SUGGESTIONS_CHANNEL_NAME,
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const DISCORD_CHANNEL_NAME = process.env.DISCORD_CHANNEL_NAME;

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.MESSAGE_CONTENT,
    ],
});

let statusMessages = new Map();

function writeBotPidFile() {
    try {
        fs.mkdirSync(path.dirname(BOT_PID_FILE), { recursive: true });
        fs.writeFileSync(BOT_PID_FILE, String(process.pid), 'utf8');
    } catch (error) {
        logger.info('Failed to write Discord bot PID file:', error);
    }
}

function removeBotPidFile() {
    try {
        if (fs.existsSync(BOT_PID_FILE)) {
            fs.unlinkSync(BOT_PID_FILE);
        }
    } catch (error) {
        logger.info('Failed to remove Discord bot PID file:', error);
    }
}

function isBotReady() {
    return Boolean(client.user);
}

async function initBot() {
    if (isBotReady()) return;

    await new Promise((resolve, reject) => {
        const handleReady = () => {
            writeBotPidFile();
            logger.info(`Discord bot logged in as ${client.user.tag}`);
            resolve();
        };

        client.once('ready', handleReady);

        client.login(BOT_TOKEN).catch((error) => {
            logger.error('Failed to log in Discord bot:', error);
            client.removeListener('ready', handleReady);
            reject(error);
        });
    });
}

async function ensureAndFetchChannel(guildId, channelName) {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    let channel = channels.find(
        (ch) => ch.name === channelName && ch.type === 'GUILD_TEXT'
    );

    if (!channel) {
        logger.info(`Channel "${channelName}" not found. Creating...`);
        channel = await guild.channels.create({
            name: channelName,
            type: 'GUILD_TEXT',
            permissionOverwrites: [
                {   
                    id: guild.roles.everyone.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL],
                    deny: [Permissions.FLAGS.SEND_MESSAGES],
                },
                {
                    id: client.user.id,
                    allow: [
                        Permissions.FLAGS.VIEW_CHANNEL,
                        Permissions.FLAGS.SEND_MESSAGES,
                    ],
                },
            ],
        });
    }

    return channel;
}

const shutdownBot = async () => {
    if (!client) return;

    client.destroy();
    removeBotPidFile();

    await new Promise(resolve => setTimeout(resolve, 1000));
};

async function sendStartEmbed(reason) {
    if (!isBotReady()) {
        logger.info('Bot not ready yet!');
        return;
    }

    const embed = new MessageEmbed()
        .setColor(0x00ff88)
        .setTitle('Melis Website Started')
        .addFields(
            {name: 'Domain', value: process.env.DOMAIN || `http://localhost:${process.env.SERVER_PORT || 5000}`, inline: false},
            {name: 'Status', value: 'Running', inline: false},
            {name: 'Reason', value: reason, inline: false}
        )
        .setTimestamp()
        .setFooter({ text: 'Melis Website Notifier' });

    for (const guild of client.guilds.cache.values()) {
        try {
            const channel = await ensureAndFetchChannel(guild.id, process.env.SERVER_STATUS_CHANNEL_NAME);
            const sentMessage = await channel.send({ embeds: [embed] });
            
            statusMessages.set(guild.id, {
                channelId: channel.id,
                messageId: sentMessage.id,
            });

        } catch (err) {
            logger.info(`Failed to send start embed to guild ${guild.id}:`, err);
        }
    }
}

async function updateEmbedForStop(reason) {
    if (!isBotReady()) {
        logger.info('Bot not ready yet!');
        return;
    }

    const newEmbed = new MessageEmbed()
        .setColor(0xff0000)
        .setTitle('Melis Website Stopped')
        .setDescription('The Melis Website server has been stopped. Be back soon!')
        .addFields(
            {name: 'Domain', value: 'N/A', inline: false},
            {name: 'Status', value: 'Stopped', inline: false},
            {name: 'Reason', value: reason, inline: false}
        )
        .setTimestamp()
        .setFooter({ text: 'Melis Website Notifier' });
    try {
        logger.info("Updating embeds for stop...");

        for (const guild of client.guilds.cache.values()) {
            try {
                const channel = await ensureAndFetchChannel(guild.id, process.env.SERVER_STATUS_CHANNEL_NAME);
                let messageId = statusMessages.get(guild.id)?.messageId || null;

                if (!messageId) {
                    const recentMessages = await channel.messages.fetch({ limit: 10 });
                    const statusMessage = recentMessages.find((msg) => {
                        if (msg.author?.id !== client.user?.id) {
                            return false;
                        }
                        const embedTitle = msg.embeds?.[0]?.title || '';
                        return embedTitle.includes('Melis Website');
                    });
                    messageId = statusMessage?.id || null;
                }

                if (!messageId) {
                    logger.info(`No status message found for guild ${guild.id}. Skipping embed update.`);
                    continue;
                }

                const message = await channel.messages.fetch(messageId);
                await message.edit({ embeds: [newEmbed] });
            } catch (err) {
                logger.info(`Failed to update embed for guild ${guild.id}:`, err);
                throw err;
            }
        }
    } catch (err) {
        logger.info("Failed to update embed:", err);
        throw err;
    } finally {
        logger.info("Finished updating embeds for stop.");
    }
}

async function sendDevMessage(content) {
    if (!isBotReady()) {
        logger.info('Bot not ready yet!');
        return;
    }

    const embed = new MessageEmbed()
        .setColor(0x0000ff)
        .setTitle('Melis Website Dev Message')
        .setDescription(content)
        .setTimestamp()
        .setFooter({ text: 'Melis Website Notifier' });
        
    for (const guild of client.guilds.cache.values()) {
        try {
            const channel = await ensureAndFetchChannel(guild.id, process.env.SERVER_DEV_MESSAGES_CHANNEL_NAME);
            await channel.send({ embeds: [embed] });
        } catch (err) {
            logger.info(`Failed to send dev message to guild ${guild.id}:`, err);
            throw err;
        }
    }
}

async function sendSuggestionEmbed(suggestion, name, userIP) {
    if (!isBotReady()) {
        logger.info('Bot not ready yet!');
        return;
    }

    const embed = new MessageEmbed()
        .setColor(0x00ff88)
        .setTitle('New Suggestion Submitted')
        .addFields(
            {name: 'Name', value: name, inline: false},
            {name: 'Suggestion', value: suggestion, inline: false},
            {name: 'IP Address', value: userIP, inline: false}
        )
        .setTimestamp()
        .setFooter({ text: 'Melis Website Suggestion' });
        
    for (const guild of client.guilds.cache.values()) {
        try {
            const channel = await ensureAndFetchChannel(guild.id, process.env.SERVER_SUGGESTIONS_CHANNEL_NAME);
            const thisSuggestionMessage = await channel.send({ embeds: [embed] });
            await thisSuggestionMessage.react('✅');
            await thisSuggestionMessage.react('❌');
        } catch (err) {
            logger.info(`Failed to send suggestion embed to guild ${guild.id}:`, err);
            throw err;
        }
    }
}

async function resetAllChannels() {
    if (!isBotReady()) {
        logger.info('Bot not ready yet!');
        return;
    }

    for (const guild of client.guilds.cache.values()) {
        try {
            for (const channelName of Object.values(BotChannels)) {
                if (channelName === process.env.SERVER_DEV_MESSAGES_CHANNEL_NAME) {
                    continue;
                }

                try {
                    const channel = await ensureAndFetchChannel(guild.id, channelName);
                    await channel.delete();
                    logger.info(`Channel "${channelName}" has been deleted in guild ${guild.id}.`);
                } catch (error) {
                    logger.error(`Error resetting channel "${channelName}" in guild ${guild.id}: ${error.message}`);
                }
            };
        } catch (error) {
            logger.error(`Error resetting channel "${DISCORD_CHANNEL_NAME}" in guild ${guild.id}: ${error.message}`);
        }
    }

    for (const guild of client.guilds.cache.values()) {
        try {
            for (const channelName of Object.values(BotChannels)) {
                try {
                    await ensureAndFetchChannel(guild.id, channelName);
                    logger.info(`Channel "${channelName}" has been reensured in guild ${guild.id}.`);
                } catch (error) {
                    logger.error(`Error reensuring channel "${channelName}" in guild ${guild.id}: ${error.message}`);
                }
            };
        } catch (error) {
            logger.error(`Error reensuring channel "${DISCORD_CHANNEL_NAME}" in guild ${guild.id}: ${error.message}`);
            throw error;
        }
    }

}

async function resetChannel(channelName) {
    if (!Object.values(BotChannels).includes(channelName)) {
        logger.info(`Invalid channel name for reset: ${channelName}`);
        return;
    }
    
    if (!isBotReady()) {
        logger.info('Bot not ready yet!');
        return;
    }

    for (const guild of client.guilds.cache.values()) {
        try {
            const channel = await ensureAndFetchChannel(guild.id, channelName);
            await channel.delete();
            logger.info(`Channel "${channelName}" has been deleted in guild ${guild.id}.`);
        } catch (error) {
            logger.error(`Error resetting channel "${channelName}" in guild ${guild.id}: ${error.message}`);
        }
    }

    for (const guild of client.guilds.cache.values()) {
        try {
            await ensureAndFetchChannel(guild.id, channelName);
            logger.info(`Channel "${channelName}" has been reensured in guild ${guild.id}.`);
        } catch (error) {
            logger.error(`Error reensuring channel "${channelName}" in guild ${guild.id}: ${error.message}`);
        }
    }
}


module.exports = {
    initBot,
    sendStartEmbed,
    shutdownBot,
    updateEmbedForStop,
    sendDevMessage,
    sendSuggestionEmbed,
    resetAllChannels,
    resetChannel,
};
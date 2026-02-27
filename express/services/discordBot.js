const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
} = require('discord.js');
const logger = require('../services/customLogger');
const { send } = require('node:process');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DISCORD_CHANNEL_NAME = process.env.DISCORD_CHANNEL_NAME;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let message = [];

async function initBot() {
    if (client.isReady()) return;

    await client.login(BOT_TOKEN);

    await new Promise((resolve) => {
        client.once('clientReady', () => {
            logger.info(`Discord bot logged in as ${client.user.tag}`);
            resolve();
        });
    });

    
}

async function ensureAndFetchChannel(guildId, channelName) {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    let channel = channels.find(
        (ch) => ch.name === channelName && ch.type === ChannelType.GuildText
    );

    if (!channel) {
        logger.info(`Channel "${channelName}" not found. Creating...`);
        channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {   
                    id: guild.roles.everyone.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                    deny: [PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                    ],
                },
            ],
        });
    }

    return channel;
}

async function shutdownBot() {
    if (client) {
        await client.destroy();
        logger.info("Discord bot has been shut down.");
    }
}

async function sendStartEmbed(domain, reason) {
    if (!client.isReady()) {
        logger.info('Bot not ready yet!');
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('Melis Website Started')
        .setFields(
            {name: 'Domain', value: domain, inline: false},
            {name: 'Status', value: 'Running', inline: false},
            {name: 'Reason', value: reason, inline: false}
        )
        .setTimestamp()
        .setFooter({ text: 'Melis Website Notifier' });

    for (const guild of client.guilds.cache.values()) {
        try {
            const channel = await ensureAndFetchChannel(guild.id, process.env.SERVER_STATUS_CHANNEL_NAME);
            message.push(await channel.send({ embeds: [embed] }));
        } catch (err) {
            logger.info(`Failed to send start embed to guild ${guild.id}:`, err);
        }
    }
}

async function updateEmbedForStop(reason) {
    const newEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('Melis Website Stopped')
        .setDescription('The Melis Website server has been stopped. Be back soon!')
        .setFields(
            {name: 'Domain', value: 'N/A', inline: false},
            {name: 'Status', value: 'Stopped', inline: false},
            {name: 'Reason', value: reason, inline: false}
        )
        .setTimestamp()
        .setFooter({ text: 'Melis Website Notifier' });
    try {
        logger.info("Updating embeds for stop...");
        for (const msg of message) {
            await msg.edit({ embeds: [newEmbed] });
        }
    } catch (err) {
        logger.info("Failed to update embed:", err);
    }
}

async function sendDevMessage(content) {
    if (!client.isReady()) {
        logger.info('Bot not ready yet!');
        return;
    }

    const embed = new EmbedBuilder()
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
        }
    }
}

async function sendSuggestionEmbed(suggestion, name, userIP) {
    if (!client.isReady()) {
        logger.info('Bot not ready yet!');
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('New Suggestion Submitted')
        .setFields(
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
};
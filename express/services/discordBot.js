const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
} = require('discord.js');
const logger = require('../services/customLogger');

const BOT_TOKEN = process.env.BOT_TOKEN;
const DISCORD_CHANNEL_NAME = process.env.DISCORD_CHANNEL_NAME;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let ready = false;
let message = null;

async function initBot() {
    client.once('clientReady', async () => {
        logger.info(`Discord bot logged in as ${client.user.tag}`);
        ready = true;
    });

    await client.login(BOT_TOKEN);
}

async function ensureAndFetchChannel(guildId) {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    let channel = channels.find(
        (ch) => ch.name === DISCORD_CHANNEL_NAME && ch.type === ChannelType.GuildText
    );

    if (!channel) {
        logger.info(`Channel "${DISCORD_CHANNEL_NAME}" not found. Creating...`);
        channel = await guild.channels.create({
            name: DISCORD_CHANNEL_NAME,
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

async function sendStartEmbed(domain) {
    if (!ready) {
        logger.info('Bot not ready yet!');
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle('Melis Website Started')
        .setFields(
            {name: 'Domain', value: domain, inline: false},
            {name: 'Status', value: 'Running', inline: false}
        )
        .setTimestamp()
        .setFooter({ text: 'Melis Website Notifier' });

    for (const guild of client.guilds.cache.values()) {
        try {
            const channel = await ensureAndFetchChannel(guild.id);
            message = await channel.send({ embeds: [embed] });
        } catch (err) {
            logger.info(`Failed to send start embed to guild ${guild.id}:`, err);
        }
    }
}

async function updateEmbedForStop() {
    const newEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('Melis Website Stopped')
        .setDescription('The Melis Website server has been stopped. Be back soon!')
        .setFields(
            {name: 'Domain', value: 'N/A', inline: false},
            {name: 'Status', value: 'Stopped', inline: false}
        )
        .setTimestamp()
        .setFooter({ text: 'Melis Website Notifier' });
    try {
        await message.edit({ embeds: [newEmbed] });
    } catch (err) {
        logger.info("Failed to update embed:", err);
    }
}

module.exports = {
    initBot,
    sendStartEmbed,
    shutdownBot,
    updateEmbedForStop,
};
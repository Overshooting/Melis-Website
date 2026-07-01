const { server, PORT, initializeCors } = require('../server/server');
const { logger } = require('../services/customLogger');
const { initBot, sendStartEmbed, shutdownBot, updateEmbedForStop } = require('../services/discordBot');
const { closeValorantPool } = require('../database/valorantDB');
const { closeWebsitePool } = require('../database/melisWebsite');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const BOT_PID_FILE = path.join(__dirname, '../../server_logs/discord-bot.pid');

function writeBotPidFile() {
    try {
        fs.mkdirSync(path.dirname(BOT_PID_FILE), { recursive: true });
        fs.writeFileSync(BOT_PID_FILE, String(process.pid), 'utf8');
    } catch (error) {
        logger.info('Failed to write bot PID file from server startup:', error);
    }
}

async function startServer() {
    let domain = process.env.DOMAIN || `http://localhost:${PORT}`;
    let httpServer = null;
    const reason = process.argv[2] || "Standard Initialization";

    writeBotPidFile();

    if (process.env.NODE_ENV === 'production') {
        try {
            await initBot();
        } catch (err) {
            logger.info(`Failed to initialize Discord bot: ${err?.message || err}`);
        }
    }

    try {
        await initializeCors(domain);

        httpServer = server.listen(PORT, '0.0.0.0', async () => {
            logger.info(`Server is running at localhost:${PORT} and accessible at ${domain}`);
            console.log(`Server is running at localhost:${PORT} and accessible at ${domain}`);
            if (process.env.NODE_ENV === 'production') {
                await sendStartEmbed(reason);
            }
        });

        let shuttingDown = false;

        const shutdown = async (shutdownReason) => {
            if (shuttingDown) return;

            shuttingDown = true;
            const forceExitTimer = setTimeout(() => {
                logger.info("Force exiting after shutdown timeout.");
                process.exit(1);
            }, 10000);
            
            logger.info("Shutting down server...");
            console.log("Shutting down server...");

            await updateEmbedForStop(shutdownReason);

            await shutdownBot();
            await closeValorantPool();
            await closeWebsitePool();

            if (httpServer) {
                await new Promise((resolve) => httpServer.close(resolve)).finally(() => {
                    logger.info("Server shutdown for reason: " + shutdownReason + " complete.");
                    clearTimeout(forceExitTimer);
                    setTimeout(() => process.exit(0), 250);
                });
            } else {
                clearTimeout(forceExitTimer);
                process.exit(0);
            }
        };

        process.on('SIGINT', () => {
            shutdown("Standard Shutdown");
        });
        process.on('SIGTERM', async () => {
            shutdown("Standard Shutdown");
        });
        process.on('uncaughtException', async (err) => {
            logger.info("Uncaught Exception: " + err);
            shutdown("Fatal Error (Uncaught Exception)").finally(() => {
                console.log("Shutdown complete");
                process.exit(1);
            });
        });
        process.on('unhandledRejection', async (err) => {
            logger.info("Unhandled Rejection: " + err);
            shutdown("Fatal Error (Unhandled Rejection)").finally(() => {
                console.log("Shutdown complete");
                process.exit(1);
            });
        });
    } catch (err) {
        logger.info("Failed to start tunnel: " + err);
        console.error("Failed to start tunnel: ", err);
        stopTunnel();
        process.exit(1);
    }
}

startServer();

const { server, PORT } = require('../server/server');
const { startTunnel, stopTunnel } = require('../services/tunnelSetup');
const logger = require('../services/customLogger');
const { initBot, sendStartEmbed, shutdownBot, updateEmbedForStop } = require('../services/discordBot');
require('dotenv').config();

async function startServer() {
    let domain = `http://localhost:${PORT}`;
    let httpServer = null;
    const reason = process.argv[2] || "Standard Initialization";

    if (process.env.NODE_ENV === 'production') {
        try {
            await initBot();
        } catch (err) {
            logger.info("Failed to initialize Discord bot:", err);
        }
    }

    try {
        if (process.env.NODE_ENV === 'production') {
            domain = await startTunnel(`http://localhost:${PORT}`);
        }

        logger.info(`Starting server at ${domain}`);

        httpServer = server.listen(PORT, '0.0.0.0', async () => {
            logger.info(`Server is running at ${domain}`);
            console.log(`Server is running at ${domain}`);
            if (process.env.NODE_ENV === 'production') {
                await sendStartEmbed(domain, reason);
            }
        });

        let shuttingDown = false;

        const shutdown = async (shutdownReason) => {
            if (shuttingDown) return;
            shuttingDown = true;
            
            logger.info("Shutting down server...");
            console.log("Shutting down server...");
            
            if (process.env.NODE_ENV === 'production') {
                try {
                    await updateEmbedForStop(shutdownReason);
                    logger.info("Embeds updated successfully.");
                } catch (err) {
                    logger.info("Failed to update stop embed: ", err);
                }
            }
            
            await shutdownBot();
            stopTunnel();

            if (httpServer) {
                await new Promise((resolve) => httpServer.close(resolve));
                logger.info("Server shutdown for reason: " + shutdownReason + " complete.");
            } else {
                process.exit(0);
            }
        };

        const forceExit = (code = 1) => {
            setTimeout(() => {
                console.log("Error caused force exit. Exiting...");
                process.exit(code);
            }, 5000);
        }

        process.on('SIGINT', () => {
            shutdown("Standard Shutdown");
        });
        process.on('SIGTERM', async () => {
            shutdown("Standard Shutdown");
        });
        process.on('uncaughtException', async (err) => {
            logger.info("Uncaught Exception: ", err);
            console.error("Uncaught Exception: ", err);
            
            forceExit(1);
            shutdown("Fatal Error (Uncaught Exception)");
        });
        process.on('unhandledRejection', async (err) => {
            logger.info("Unhandled Rejection:", err);
            console.error("Unhandled Rejection:", err);

            forceExit(1);
            shutdown("Fatal Error (Unhandled Rejection)");
        });
    } catch (err) {
        logger.info("Failed to start tunnel: ", err);
        console.error("Failed to start tunnel: ", err);
        stopTunnel();
        process.exit(1);
    }
}

startServer();
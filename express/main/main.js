const { server, PORT } = require('../server/server');
const { startTunnel, stopTunnel } = require('../services/tunnelSetup');
const logger = require('../services/customLogger');
const { initBot, sendStartEmbed, shutdownBot, updateEmbedForStop } = require('../services/discordBot');

async function startServer() {
    let domain = `http://localhost:${PORT}`;
    let httpServer = null;

    if (process.env.NODE_ENV === 'production') {
        await initBot();
    }

    try {
        domain = await startTunnel(`http://localhost:${PORT}`);

        logger.info(`Starting server at ${domain}`);

        httpServer = server.listen(PORT, '0.0.0.0', async () => {
            logger.info(`Server is running at ${domain}`);
            console.log(`Server is running at ${domain}`);
            if (process.env.NODE_ENV === 'production') {
                await sendStartEmbed(domain);
            }
        });

        let shuttingDown = false;

        const shutdown = async () => {
            if (shuttingDown) return;
            shuttingDown = true;
            
            logger.info("Shutting down server...");
            console.log("Shutting down server...");
            
            if (process.env.NODE_ENV === 'production') {
                await updateEmbedForStop();
            }
            
            await shutdownBot();
            stopTunnel();

            if (httpServer) {
                await new Promise((resolve) => httpServer.close(resolve));
                logger.info("Server shutdown complete.");
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
            shutdown().finally(() => process.exit(0));
        });
        process.on('SIGTERM', async () => {
            shutdown().finally(() => process.exit(0));
        });
        process.on('uncaughtException', async (err) => {
            logger.info("Uncaught Exception: ", err);
            console.error("Uncaught Exception: ", err);
            
            forceExit(1);
            shutdown().finally(() => process.exit(1));
        });
        process.on('unhandledRejection', async (err) => {
            logger.info("Unhandled Rejection:", err);
            console.error("Unhandled Rejection:", err);

            forceExit(1);
            shutdown().finally(() => process.exit(1));
        });
    } catch (err) {
        logger.info("Failed to start tunnel: ", err);
        console.error("Failed to start tunnel: ", err);
        stopTunnel();
        process.exit(1);
    }
}

startServer();
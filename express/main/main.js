const { server, PORT } = require('../server/server');
const { startTunnel, stopTunnel } = require('./tunnelSetup');
const logger = require('../server/customLogger');
const argon2 = require('argon2');

async function startServer() {
    let domain = `http://localhost:${PORT}`;
    let httpServer = null;

    try {
        domain = await startTunnel(`http://localhost:${PORT}`);

        logger.info(`Starting server at ${domain}`);

        httpServer = server.listen(PORT, '0.0.0.0', () => {
            logger.info(`Server is running at ${domain}`);
            console.log(`Server is running at ${domain}`);
        });

        const shutdown = () => {
            logger.info("Shutting down server...");
            stopTunnel();

            if (httpServer) {
                httpServer.close(() => {
                    logger.info("Server closed.");
                    console.log("Server closed");
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('uncaughtException', (err) => {
            logger.info("Uncaught Exception: ", err);
            console.error("Uncaught Exception: ", err)
            shutdown();
        });
        process.on('unhandledRejection', (err) => {
            logger.info("Unhandled Rejection:", err);
            console.error("Unhandled Rejection:", err);
            shutdown();
        });
    } catch (err) {
        logger.info("Failed to start tunnel: ", err);
        console.error("Failed to start tunnel: ", err);
        stopTunnel();
        process.exit(1);
    }
}

startServer();
const { server, PORT } = require('../server/server');
const DOMAIN = process.env.CLOUDFLARED_DOMAIN || `http://localhost:${PORT}`;
const logger = require('../server/customLogger');
const argon2 = require('argon2');


logger.info(`Starting server at ${DOMAIN}`);

if (process.env.ENV !== 'production') {
    console.log(`Starting server in development mode at ${DOMAIN}`);
}

server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running at ${DOMAIN}`);

    if (process.env.ENV !== 'production') {
        console.log(`Server is running in development mode at ${DOMAIN}`);
    }
});
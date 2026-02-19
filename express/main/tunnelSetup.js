const logger = require('../server/customLogger');
const { spawn } = require('child_process');

let tunnelProcess = null;

function startTunnel(localUrl) {
    logger.info("Initializing cloudflared tunnel");

    return new Promise((resolve, reject) => {
        tunnelProcess = spawn('cloudflared', [
            'tunnel',
            '--url',
            localUrl
        ]);

        let resolved = false;

        tunnelProcess.stderr.on('data', (data) => {
            const output = data.toString();

            const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);

            if (match && !resolved) {
                resolved = true;

                logger.info('Cloudflared tunnel resolved to: ' + match[0]);

                resolve(match[0]);
            }
        });

        tunnelProcess.on('error', (err) => {
            reject(err);
        });

        tunnelProcess.on('close', (code) => {
            if (!resolved) {
                reject(new Error(`Tunnel exited early with code ${code}`));
            }
        });
    });
};

function stopTunnel() {
    if (tunnelProcess) {
        logger.info("Shutting down clouflared tunnel...");
        tunnelProcess.kill('SIGTERM');
    }
};

module.exports = {startTunnel, stopTunnel};




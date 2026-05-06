const { logger } = require('./customLogger');
const { spawn } = require('child_process');

let tunnelProcess = null;

function startTunnel(localUrl) {
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
    if (!tunnelProcess) return;

    logger.info("Shutting down clouflared tunnel...");

    return new Promise((resolve) => {
        let resolved = false;
        const finish = (signal) => {
            if (resolved) return;
            resolved = true;
            tunnelProcess = null;
            logger.info(`Cloudflared tunnel fully stopped.`);
            resolve();
        };

        if (tunnelProcess.exitCode !== null || tunnelProcess.killed) {
            finish(tunnelProcess.exitCode !== null ? `code ${tunnelProcess.exitCode}` : '');
            return;
        }

        tunnelProcess.once('exit', (code, signal) => {
            finish(signal || (code !== null ? `code ${code}` : ''));
        });

        const killTimer = setTimeout(() => {
            try {
                tunnelProcess.kill('SIGKILL');
            } catch (error) {
            }
        }, 3000);

        const resolveTimer = setTimeout(() => {
            finish('timeout');
        }, 4000);

        tunnelProcess.once('close', () => {
            clearTimeout(killTimer);
            clearTimeout(resolveTimer);
            finish();
        });

        try {
            tunnelProcess.kill('SIGTERM');
        } catch (error) {
            clearTimeout(killTimer);
            clearTimeout(resolveTimer);
            finish();
        }
    });
}

module.exports = {startTunnel, stopTunnel};




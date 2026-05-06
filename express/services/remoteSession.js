const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const screenshot = require('screenshot-desktop');
const sharp = require('sharp');
const robot = require('robotjs');

const SESSION_TTL_MS = 60 * 1000;
const FRAME_INTERVAL_MS = 100;
const MAX_BUFFERED_BYTES = 2 * 1024 * 1024;
const MAX_MESSAGE_BYTES = 8 * 1024;
const INPUT_RATE_PER_SEC = 60;
const INPUT_BURST = 120;
const JPEG_QUALITY = 80;
const SCALE_FACTOR = 0.5;
const SESSION_STATE_FILE = path.join(__dirname, '../../server_logs/remote_session.json');

let wssInstance = null;

const sessionState = {
    active: false,
    tokenHash: null,
    tokenExpiresAt: 0,
    sessionKeyHash: null,
    ws: null,
    streamInterval: null,
    lastFrameHash: null,
};

function hashToken(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function persistSessionState() {
    const snapshot = {
        active: sessionState.active,
        tokenHash: sessionState.tokenHash,
        tokenExpiresAt: sessionState.tokenExpiresAt,
        sessionKeyHash: sessionState.sessionKeyHash,
    };

    try {
        fs.writeFileSync(SESSION_STATE_FILE, JSON.stringify(snapshot), 'utf8');
        // Set restrictive file permissions (owner read/write only)
        fs.chmodSync(SESSION_STATE_FILE, 0o600);
    } catch (error) {
        // Ignore persistence failures to avoid breaking remote login.
    }
}

function loadPersistedSessionState() {
    try {
        if (!fs.existsSync(SESSION_STATE_FILE)) {
            return;
        }

        const raw = fs.readFileSync(SESSION_STATE_FILE, 'utf8');
        const parsed = JSON.parse(raw);

        sessionState.active = Boolean(parsed.active);
        sessionState.tokenHash = parsed.tokenHash || null;
        sessionState.tokenExpiresAt = Number(parsed.tokenExpiresAt) || 0;
        sessionState.sessionKeyHash = parsed.sessionKeyHash || null;

        if (sessionState.tokenHash && Date.now() >= sessionState.tokenExpiresAt) {
            clearSession();
        }
    } catch (error) {
        clearSession();
    }
}

function getCookieValue(cookieHeader, name) {
    if (!cookieHeader) {
        return null;
    }

    const parts = cookieHeader.split(';');
    for (const part of parts) {
        const [key, ...valueParts] = part.trim().split('=');
        if (key === name) {
            return decodeURIComponent(valueParts.join('='));
        }
    }

    return null;
}

function clearSession() {
    sessionState.active = false;
    sessionState.tokenHash = null;
    sessionState.tokenExpiresAt = 0;
    sessionState.sessionKeyHash = null;
    sessionState.ws = null;
    sessionState.lastFrameHash = null;
    if (sessionState.streamInterval) {
        clearInterval(sessionState.streamInterval);
        sessionState.streamInterval = null;
    }

    persistSessionState();
}

function isSessionActive() {
    if (sessionState.active) {
        return true;
    }

    if (sessionState.tokenHash && Date.now() < sessionState.tokenExpiresAt) {
        return true;
    }

    if (sessionState.tokenHash && Date.now() >= sessionState.tokenExpiresAt) {
        clearSession();
    }

    return false;
}

function reserveSession() {
    if (isSessionActive()) {
        return { ok: false };
    }

    const token = crypto.randomBytes(24).toString('hex');
    const sessionKey = crypto.randomBytes(24).toString('hex');
    sessionState.tokenHash = hashToken(token);
    sessionState.tokenExpiresAt = Date.now() + SESSION_TTL_MS;
    sessionState.sessionKeyHash = hashToken(sessionKey);

    persistSessionState();

    return { ok: true, token, sessionKey };
}

function disconnectSession(sessionKey) {
    if (!sessionKey || hashToken(sessionKey) !== sessionState.sessionKeyHash) {
        return false;
    }

    if (sessionState.ws && sessionState.ws.readyState === WebSocket.OPEN) {
        sessionState.ws.close(4000, 'Remote session ended');
    }

    clearSession();
    return true;
}

function startStreaming(ws) {
    const screenSize = robot.getScreenSize();
    const targetWidth = Math.round(screenSize.width * SCALE_FACTOR);
    const targetHeight = Math.round(screenSize.height * SCALE_FACTOR);
    let isCapturing = false;
    let frameDropCount = 0;
    const MAX_BACKLOG_THRESHOLD = MAX_BUFFERED_BYTES * 0.75; // Drop frames if 75% full

    sessionState.streamInterval = setInterval(async () => {
        if (isCapturing || ws.readyState !== WebSocket.OPEN) {
            return;
        }

        // Adaptive rate limiting: skip frames if buffer is filling up
        if (ws.bufferedAmount > MAX_BACKLOG_THRESHOLD) {
            frameDropCount++;
            if (frameDropCount < 3) {
                // Skip every frame until buffer clears
                return;
            }
        } else {
            frameDropCount = 0;
        }

        // Hard stop if buffer is completely full
        if (ws.bufferedAmount > MAX_BUFFERED_BYTES) {
            return;
        }

        isCapturing = true;
        try {
            const imageBuffer = await screenshot({ format: 'jpg' });
            const resizedBuffer = await sharp(imageBuffer)
                .resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: JPEG_QUALITY })
                .toBuffer();

            const frameHash = crypto.createHash('sha1').update(resizedBuffer).digest('hex');
            if (frameHash === sessionState.lastFrameHash) {
                return;
            }

            sessionState.lastFrameHash = frameHash;
            const payload = JSON.stringify({
                type: 'frame',
                mime: 'image/jpeg',
                width: targetWidth,
                height: targetHeight,
                data: resizedBuffer.toString('base64'),
            });
            ws.send(payload);
        } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: 'Screen capture failed.' }));
        } finally {
            isCapturing = false;
        }
    }, FRAME_INTERVAL_MS);
}

function applyMouseMove(message) {
    const screenSize = robot.getScreenSize();
    const x = Math.round(message.x * screenSize.width);
    const y = Math.round(message.y * screenSize.height);
    robot.moveMouse(x, y);
}

function applyMouseClick(message) {
    const button = message.button === 'right' ? 'right' : 'left';
    robot.mouseClick(button, Boolean(message.double));
}

function applyMouseToggle(message, isDown) {
    const button = message.button === 'right' ? 'right' : 'left';
    robot.mouseToggle(isDown ? 'down' : 'up', button);
}

function applyWheel(message) {
    const deltaX = Number(message.deltaX) || 0;
    const deltaY = Number(message.deltaY) || 0;
    robot.scrollMouse(deltaX, deltaY);
}

const KEY_MAP = {
    ' ': 'space',
    Enter: 'enter',
    Tab: 'tab',
    Escape: 'escape',
    Backspace: 'backspace',
    Delete: 'delete',
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
};

function normalizeKey(key) {
    if (!key) {
        return null;
    }

    if (KEY_MAP[key]) {
        return KEY_MAP[key];
    }

    if (key.length === 1) {
        return key.toLowerCase();
    }

    return key.toLowerCase();
}

function applyKey(message, isDown) {
    const normalizedKey = normalizeKey(message.key);
    if (!normalizedKey) {
        return;
    }

    robot.keyToggle(normalizedKey, isDown ? 'down' : 'up');
}

function handleInputMessage(rawMessage) {
    if (!rawMessage || typeof rawMessage !== 'object') {
        return;
    }

    switch (rawMessage.type) {
        case 'mouseMove':
            applyMouseMove(rawMessage);
            break;
        case 'mouseClick':
            applyMouseClick(rawMessage);
            break;
        case 'mouseDown':
            applyMouseToggle(rawMessage, true);
            break;
        case 'mouseUp':
            applyMouseToggle(rawMessage, false);
            break;
        case 'wheel':
            applyWheel(rawMessage);
            break;
        case 'keyDown':
            applyKey(rawMessage, true);
            break;
        case 'keyUp':
            applyKey(rawMessage, false);
            break;
        default:
            break;
    }
}

function buildInputLimiter() {
    let tokens = INPUT_BURST;
    let lastRefill = Date.now();
    let droppedInputs = 0;

    return () => {
        const now = Date.now();
        const elapsedSeconds = Math.max((now - lastRefill) / 1000, 0);
        tokens = Math.min(INPUT_BURST, tokens + elapsedSeconds * INPUT_RATE_PER_SEC);
        lastRefill = now;

        if (tokens >= 1) {
            tokens -= 1;
            droppedInputs = 0;
            return { allowed: true, dropped: 0 };
        }

        droppedInputs += 1;
        return { allowed: false, dropped: droppedInputs };
    };
}

function initRemoteSession(httpServer) {
    wss = new WebSocket.Server({ server: httpServer, path: '/remote-login/ws' });
    wssInstance = wss;

    wss.on('connection', (ws, req) => {
        const requestUrl = new URL(req.url, 'http://localhost');
        const tokenFromQuery = requestUrl.searchParams.get('token');
        const tokenFromCookie = getCookieValue(req.headers.cookie, 'remote_login_token');
        const token = tokenFromQuery || tokenFromCookie;

        if (!token || hashToken(token) !== sessionState.tokenHash || Date.now() > sessionState.tokenExpiresAt) {
            ws.close(4001, 'Invalid or expired token');
            return;
        }

        if (sessionState.active) {
            ws.close(4090, 'Session already active');
            return;
        }

        sessionState.active = true;
        sessionState.ws = ws;
        sessionState.tokenHash = null;
        sessionState.tokenExpiresAt = 0;

        persistSessionState();

        const allowInput = buildInputLimiter();

        startStreaming(ws);

        ws.on('message', (message) => {
            if (message.length > MAX_MESSAGE_BYTES) {
                ws.close(4002, 'Input too large');
                return;
            }

            const rateCheck = allowInput();
            if (!rateCheck.allowed) {
                if (rateCheck.dropped >= 20) {
                    ws.close(4003, 'Input rate exceeded');
                }
                return;
            }

            try {
                const parsed = JSON.parse(message.toString());
                handleInputMessage(parsed);
            } catch (error) {
                return;
            }
        });

        ws.on('close', () => {
            clearSession();
        });

        ws.on('error', () => {
            clearSession();
        });
    });
}

async function shutdownRemoteSession() {
    if (sessionState.streamInterval) {
        clearInterval(sessionState.streamInterval);
        sessionState.streamInterval = null;
    }

    if (sessionState.ws && sessionState.ws.readyState === WebSocket.OPEN) {
        try {
            sessionState.ws.close(1001, 'Server shutdown');
        } catch (error) {
            // Best-effort close; continue shutdown.
        }
    }

    if (!wssInstance) {
        clearSession();
        return;
    }

    const clients = Array.from(wssInstance.clients || []);
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.close(1001, 'Server shutdown');
            } catch (error) {
                // Ignore close errors on shutdown.
            }
        }
    }

    await Promise.race([
        new Promise((resolve) => {
            wssInstance.close(() => {
                wssInstance = null;
                resolve();
            });
        }),
        new Promise((resolve) => {
            setTimeout(() => {
                for (const client of clients) {
                    try {
                        client.terminate();
                    } catch (error) {
                        // Ignore terminate errors on shutdown.
                    }
                }
                wssInstance = null;
                resolve();
            }, 2000);
        }),
    ]);

    clearSession();
}

loadPersistedSessionState();

module.exports = {
    initRemoteSession,
    shutdownRemoteSession,
    reserveSession,
    isSessionActive,
    disconnectSession,
    SESSION_TTL_MS,
};

const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const db = require('../../database/valorantDB');
const { reserveSession, isSessionActive, disconnectSession, SESSION_TTL_MS } = require('../../services/remoteSession');
require('dotenv').config();

const SESSION_KEY_TTL_MS = 2 * 60 * 60 * 1000;

// Track failed login attempts per IP
const failedAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Clean up old entries every 5 minutes to prevent memory leak
setInterval(() => {
	const now = Date.now();
	for (const [ip, attempt] of failedAttempts.entries()) {
		// Remove entries older than lockout duration to prevent unbounded growth
		if (now - attempt.lastAttempt > LOCKOUT_DURATION_MS) {
			failedAttempts.delete(ip);
		}
	}
}, 5 * 60 * 1000);

function getClientIP(req) {
	// Only use cf-connecting-ip (Cloudflare header, trusted source)
	if (req.headers['cf-connecting-ip']) {
		return req.headers['cf-connecting-ip'];
	}
	
	// For x-forwarded-for, only trust if explicitly configured and validate format
	if (req.headers['x-forwarded-for'] && process.env.TRUST_PROXY === 'true') {
		const ips = req.headers['x-forwarded-for'].split(',');
		const ip = ips[0].trim();
		// Validate IP format to prevent injection attacks
		if (/^[\d.]+$/.test(ip) || /^[\da-f:]+$/i.test(ip)) {
			return ip;
		}
	}
	
	// Fall back to direct connection IP
	return req.socket.remoteAddress || 'unknown';
}

function isLoginLocked(ip) {
	const attempt = failedAttempts.get(ip);
	if (!attempt) return false;
	
	if (Date.now() - attempt.lastAttempt > LOCKOUT_DURATION_MS) {
		failedAttempts.delete(ip);
		return false;
	}
	
	return attempt.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip) {
	const attempt = failedAttempts.get(ip);
	if (attempt) {
		attempt.count += 1;
		attempt.lastAttempt = Date.now();
	} else {
		failedAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
	}
}

function recordSuccessfulLogin(ip) {
	failedAttempts.delete(ip);
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

function buildCookieOptions(maxAgeMs) {
	const parts = ['HttpOnly', 'Path=/', 'SameSite=Strict'];
	// Secure flag should always be set for sensitive cookies, even in development
	// Use SECURE_COOKIES env var to disable only if absolutely necessary for local testing
	if (process.env.NODE_ENV === 'production' || process.env.SECURE_COOKIES !== 'false') {
		parts.push('Secure');
	}
	if (typeof maxAgeMs === 'number') {
		parts.push(`Max-Age=${Math.floor(maxAgeMs / 1000)}`);
	}
	return parts.join('; ');
}

function setCookie(res, name, value, maxAgeMs) {
	const encodedValue = encodeURIComponent(value);
	const cookie = `${name}=${encodedValue}; ${buildCookieOptions(maxAgeMs)}`;
	res.append('Set-Cookie', cookie);
}

function clearCookie(res, name) {
	const cookie = `${name}=; ${buildCookieOptions(0)}`;
	res.append('Set-Cookie', cookie);
}

async function isAdminPasswordValid(password) {
	if (!password) {
		return false;
	}

	const rows = await db.getAdminPassword();
	if (!rows || rows.length === 0) {
		return false;
	}

	for (const row of rows) {
		if (!row.password) {
			continue;
		}

		const isValid = await argon2.verify(row.password, password);
		if (isValid) {
			return true;
		}
	}

	return false;
}

router.post('/', async (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
        return res.status(409).json({ message: 'Remote login is only available in production environment' });
    }
	
	const clientIP = getClientIP(req);
	const { adminPassword } = req.body;

	if (!adminPassword) {
		return res.status(400).json({ message: 'Administrator password is required' });
	}

	// Check if IP is locked out from too many failed attempts
	if (isLoginLocked(clientIP)) {
		return res.status(429).json({ message: 'Too many failed login attempts. Please try again later.' });
	}

	try {
		if (isSessionActive()) {
			return res.status(409).json({ message: 'Remote session already active' });
		}

		const isValid = await isAdminPasswordValid(adminPassword);

		if (!isValid) {
			recordFailedAttempt(clientIP);
			return res.status(401).json({ message: 'Invalid administrator password' });
		}

		const reservation = reserveSession();
		if (!reservation.ok) {
			return res.status(409).json({ message: 'Remote session already active' });
		}

		// Success - clear failed attempts
		recordSuccessfulLogin(clientIP);

		setCookie(res, 'remote_login_token', reservation.token, SESSION_TTL_MS);
		setCookie(res, 'remote_login_key', reservation.sessionKey, SESSION_KEY_TTL_MS);

		res.status(200).json({
			message: 'Administrator password verified',
			wsPath: '/remote-login/ws',
		});
	} catch (error) {
		res.status(500).json({ message: 'Error validating administrator password' });
	}
});

router.post('/disconnect', (req, res) => {
	const { sessionKey } = req.body;
	const sessionKeyFromCookie = getCookieValue(req.headers.cookie, 'remote_login_key');
	const effectiveSessionKey = sessionKey || sessionKeyFromCookie;

	if (!effectiveSessionKey) {
		return res.status(400).json({ message: 'Session key is required' });
	}

	const disconnected = disconnectSession(effectiveSessionKey);
	if (!disconnected) {
		return res.status(409).json({ message: 'No active session to disconnect' });
	}

	clearCookie(res, 'remote_login_token');
	clearCookie(res, 'remote_login_key');

	return res.status(200).json({ message: 'Remote session disconnected' });
});

module.exports = router;

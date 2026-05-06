const express = require('express');
const router = express.Router();
const db = require('../../database/valorantDB');
const path = require('path');
const argon2 = require('argon2');

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 20;
const MAX_NAME_LENGTH = 20;

function validateUsername(username) {
    if (typeof username !== 'string') return false;
    if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH) return false;
    return true;
}

function validatePassword(password) {
    if (typeof password !== 'string') return false;
    return password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
}

function validateName(name) {
    if (typeof name !== 'string') return false;
    return name.length > 0 && name.length <= MAX_NAME_LENGTH;
}

router.post('/', async (req, res) => {
    const { username, personName, password } = req.body;
    try {
        if (!validateUsername(username) || !validatePassword(password) || !validateName(personName)) {
            return res.status(400).send('Invalid input parameters');
        }
        const GENERIC_ERROR = 'Unable to claim account';
        const rows = await db.getAccountPassword(username);
        if (rows.length === 0) {
            return res.status(409).send(GENERIC_ERROR);
        }

        const isValid = await argon2.verify(rows[0].password, password);
        if (!isValid) {
            return res.status(409).send(GENERIC_ERROR);
        }

        const result = await db.claimAccount(username, personName);

        if (result.affectedRows === 0) {
            return res.status(409).send(GENERIC_ERROR);
        }

        res.status(200).send('Account ' + username + ' claimed successfully by ' + personName);
    } catch (error) {
        res.status(500).send('Error claiming account');
    }
});

module.exports = router;
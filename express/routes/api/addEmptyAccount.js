const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../../database/valorantDB');
const argon2 = require('argon2');

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 20;

function validateUsername(username) {
    if (typeof username !== 'string') return false;
    if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH) return false;
    return true;
}

function validatePassword(password) {
    if (typeof password !== 'string') return false;
    return password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH;
}

router.post('/', async (req, res) => {
    const { username, password }= req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    if (!validateUsername(username) || !validatePassword(password)) {
        return res.status(400).send('Username and password do not meet requirements');
    }

    try {
        if (await db.accountExists(username)) {
            return res.status(409).send('Username already exists');
        }

        const hashed = await argon2.hash(password);
        
        await db.createEmptyAccount(username, hashed);
        
        res.status(201).send('Empty account with username ' + username + ' added successfully');
    } catch (error) {
        res.status(500).send('Error adding empty account');
    }

});

module.exports = router;
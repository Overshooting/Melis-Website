const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../../database/db');
const argon2 = require('argon2');

router.post('/', async (req, res) => {
    const { username, password }= req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
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
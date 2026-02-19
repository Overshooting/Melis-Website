const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const path = require('path');
const argon2 = require('argon2');

router.post('/', async (req, res) => {
    const { username, personName, password }= req.body;
    try {
        const rows = await db.getAccountPassword(username);
        if (rows.length === 0) {
            return res.status(409).send('Account is already claimed or does not exist');
        }

        const isValid = await argon2.verify(rows[0].password, password);
        if (!isValid) {
            return res.status(409).send('Account is already claimed or does not exist');
        }

        const result = await db.claimAccount(username, personName);

        if (result.affectedRows === 0) {
            return res.status(409).send('Account is already claimed or does not exist');
        }

        res.status(200).send('Account ' + username + ' claimed successfully by ' + personName);
    } catch (error) {
        res.status(500).send('Error claiming account');
    }
});

module.exports = router;
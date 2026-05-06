const express = require('express');
const router = express.Router();
const db = require('../../database/valorantDB');
const argon2 = require('argon2');

router.get('/', async (req, res) => {
    try {
        const rows = await db.getAllOwners();
        res.json(rows);
    } catch (error) {
        res.status(500).send('Error retrieving account data');
    }
});

router.delete('/', async (req, res) => {
    const { username, password }= req.body;
    try {
        const rows = await db.getAccountPassword(username);
        const GENERIC_ERROR = 'Invalid credentials';

        if (rows.length === 0) {
            return res.status(409).send(GENERIC_ERROR);
        }

        const isValid = await argon2.verify(rows[0].password, password);
        if (!isValid) {
            return res.status(409).send(GENERIC_ERROR);
        }

        await db.deleteAccount(username);

        res.status(200).send('Account ' + username + ' deleted successfully');
    } catch (error) {
        res.status(500).send('Error deleting account');
    }
});

module.exports = router;
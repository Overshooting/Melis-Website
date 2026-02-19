const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const argon2 = require('argon2');

router.delete('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        const accountExists = await db.accountExists(username);

        if (!accountExists) {
            return res.status(409).send('Incorrect username or password');
        } else {
            console.log("Exists check run successfully");
        }

        const rows = await db.getAdminPassword();

        const isValid = await argon2.verify(rows[0].password, password);

        if (isValid) {
            await db.deleteAccount(username);
            return res.status(200).send('Account ' + username + ' deleted');
        } else {
            return res.status(409).send('Incorrect username or password');
        }
    } catch (error) {
        return res.status(500).send('Error deleting account: ' + error);
    }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const path = require('path');

router.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '../../../website/pages/accounts/accounts.html'));
});

module.exports = router;
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../website/pages/modSubmissions/submitArt/submitArt.html'));
});

module.exports = router;
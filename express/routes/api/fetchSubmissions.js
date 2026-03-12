const express = require('express');
const router = express.Router();
const db = require('../../database/melisWebsite');

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * 10;
        const page_size = 16;

        const rows = await db.getArtPage(page_size, offset);

        const totalRows = await db.countArtRows();
        const totalPages = Math.ceil(totalRows / page_size);

        res.status(200).json({
            page,
            totalPages,
            submissions: rows
        });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while fetching submissions' });
    }
});

module.exports = router;
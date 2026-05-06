const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../../database/melisWebsite');
const multer = require('multer');
const ratelimit = require('express-rate-limit');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../services/customLogger');

const storage = multer.memoryStorage();

const uploadLimiter = ratelimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many uploads. Please try again later.' },
});

const MAX_NAME_LENGTH = 80;
const MAX_TITLE_LENGTH = 120;
const MAX_PIXELS = 4096 * 4096;

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },

    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, and GIF files are allowed'));
        }
    }
});

router.post('/', uploadLimiter, upload.single('image'), async (req, res) => {
    try {
        const formData = req.body;
        const title = String(formData.artTitle || '').trim();
        const author = String(formData.artistName || '').trim();
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!title || !author) {
            return res.status(400).json({ message: 'Title and author are required' });
        }

        if (title.length > MAX_TITLE_LENGTH || author.length > MAX_NAME_LENGTH) {
            return res.status(400).json({ message: 'Title or author is too long' });
        }

        let metadata;
        try {
            metadata = await sharp(file.buffer, { limitInputPixels: MAX_PIXELS }).metadata();
        } catch (error) {
            return res.status(400).json({ message: 'Invalid or unsupported image file' });
        }

        if (!metadata.width || !metadata.height) {
            return res.status(400).json({ message: 'Invalid image dimensions' });
        }

        if (metadata.width * metadata.height > MAX_PIXELS) {
            return res.status(413).json({ message: 'Image is too large' });
        }

        const uniqueFileName = uuidv4() + '.webp';

        const outputPath = path.join(__dirname, '../../../art_submissions', uniqueFileName);

        await sharp(file.buffer, { limitInputPixels: MAX_PIXELS })
            .resize(1200)
            .toFormat('webp')
            .toFile(outputPath);
        
        await db.insertNewArt(title, author, uniqueFileName);
        res.status(201).json({ message: 'Art submitted successfully' });
    } catch (error) {
        logger.error(`Art submission failed: ${error.message}`);
        res.status(500).json({ message: 'Unable to process submission' });
    }
});

module.exports = router;
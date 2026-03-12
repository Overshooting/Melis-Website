const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../../database/melisWebsite');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../services/customLogger');

const storage = multer.memoryStorage();

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

router.post('/', upload.single('image'), async (req, res) => {
    try {
        const formData = req.body;

        const title = formData.artTitle;
        const author = formData.artistName;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!title || !author) {
            return res.status(400).json({ message: 'Title and author are required' });
        }

        const uniqueFileName = uuidv4() + '.webp';

        const outputPath = path.join(__dirname, '../../../art_submissions', uniqueFileName);

        await sharp(file.buffer)
            .resize(1200)
            .toFormat('webp')
            .toFile(outputPath);
        
        await db.insertNewArt(title, author, uniqueFileName);
        res.status(201).json({ message: 'Art submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    
});

module.exports = router;
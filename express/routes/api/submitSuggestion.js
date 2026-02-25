const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { initBot, sendSuggestionEmbed } = require('../../services/discordBot');

router.post('/', async (req, res) => {
    const { name, suggestion } = req.body;
    try {
        if (process.env.NODE_ENV === 'production') {
            await initBot();
            await sendSuggestionEmbed(suggestion, name);

            res.status(200).send('Suggestion submitted successfully by ' + name);
        } else if (process.env.NODE_ENV === 'development') {
            const suggestionsDir = path.join(__dirname, '../../../suggestions');
            if (!fs.existsSync(suggestionsDir)) {
                fs.mkdirSync(suggestionsDir);
            }

            const suggestionMessage = {
                name: name,
                suggestion: suggestion,
            }

            const suggestionFile = path.join(suggestionsDir, `${Date.now()}_${name.replace(/\s+/g, '_')}.json`);
            fs.writeFileSync(suggestionFile, JSON.stringify(suggestionMessage, null, 2));

            res.status(200).send('Local suggestion submitted successfully by ' + name);
        }
    } catch (error) {
        res.status(500).send('Error submitting suggestion.');
    }
});

module.exports = router;
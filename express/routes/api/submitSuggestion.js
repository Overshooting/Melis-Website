const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { initBot, sendSuggestionEmbed } = require('../../services/discordBot');

let bannedIps = [];
let usersActions = new Map();

router.post('/', async (req, res) => {
    const { name, suggestion } = req.body;
        const userIP = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    try {
        if (process.env.NODE_ENV === 'production') {
            if (bannedIps.includes(userIP)) {
                res.status(403).send('You are banned from submitting suggestions for this session.');
                return;
            } else if (usersActions.get(userIP) >= 3) {
                bannedIps.push(userIP);
                logger.info(`IP ${userIP} has been banned from submitting suggestions due to excessive submissions.`);
            }

            await initBot();
            await sendSuggestionEmbed(suggestion, name, userIP);

            if (usersActions.has(userIP)) {
                usersActions.set(userIP, usersActions.get(userIP) + 1);
            } else {
                usersActions.set(userIP, 1);
            }

            res.status(200).send('Suggestion submitted successfully by ' + name);
        } else if (process.env.NODE_ENV === 'development') {
            const suggestionsDir = path.join(__dirname, '../../../suggestions');
            if (!fs.existsSync(suggestionsDir)) {
                fs.mkdirSync(suggestionsDir);
            }

            const suggestionMessage = {
                name: name,
                suggestion: suggestion,
                ip: userIP
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
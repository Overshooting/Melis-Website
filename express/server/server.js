const express = require('express');
const server = express();
const path = require('path');
const cors = require('cors');
const ratelimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('../services/customLogger');
require('dotenv').config();

const accountsRouter = require('../routes/website/accounts');
const homeRouter = require('../routes/website/home');
const dataRouter = require('../routes/api/accountsData');
const addEmptyAccountRouter = require('../routes/api/addEmptyAccount');
const claimAccountRouter = require('../routes/api/claimAccount');
const accountsAdminRouter = require('../routes/api/adminBypass');
const randomNumberGeneratorRouter = require('../routes/website/randomNumberGenerator');
const randomQuoteRouter = require('../routes/website/randomQuote');
const adminHelpRouter = require('../routes/website/adminHelp');
const suggestionsRouter = require('../routes/website/suggestions');
const submitSuggestionRouter = require('../routes/api/submitSuggestion');
const williamWebsiteRouter = require('../routes/website/williamwebsite/frontpage');

const PORT = process.env.SERVER_PORT || 5000;

server.set('trust proxy', 1);

morgan.token('real-addr', (req) => {
    return req.headers['cf-connecting-ip'] || 
    req.headers['x-forwarded-for'] || 
    req.socket.remoteAddress;
});

// Request logging
server.use(morgan('Incoming :method request from :url at :real-addr. Status :status sent after :response-time ms',
    {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
        skip: (req) => 
            req.url.match(/\.(css|js|png|jpg|jpeg|svg|ico)$/),
    }
));

//Configure app safety nets
const limiter = ratelimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});


server.use(express.static(path.join(__dirname, '../../website')));
server.use(helmet());
server.use('/api', limiter);
server.use(cors(({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
})));
server.use(express.json());

// API routes
server.use('/api/accounts/data', dataRouter);
server.use('/api/accounts/add-empty', addEmptyAccountRouter);
server.use('/api/accounts/claim', claimAccountRouter);
server.use('/api/accounts/admin-bypass', accountsAdminRouter);
server.use('/api/suggestions/submit', submitSuggestionRouter);

// Website routes
server.use('/', homeRouter);
server.use('/random-number-generator', randomNumberGeneratorRouter);
server.use('/accounts', accountsRouter);
server.use('/random-quote', randomQuoteRouter);
server.use('/accounts/admin-help', adminHelpRouter);
server.use('/suggestions', suggestionsRouter);
server.use('/williamwebsite', williamWebsiteRouter);

module.exports = {server, PORT};
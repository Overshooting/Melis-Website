const express = require('express');
const server = express();
const path = require('path');
const cors = require('cors');
const ratelimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const { logger } = require('../services/customLogger');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
require('dotenv').config();

const accountsRouter = require('../routes/website/accounts');
const homeRouter = require('../routes/website/home');
const dataRouter = require('../routes/api/accountsData');
const addEmptyAccountRouter = require('../routes/api/addEmptyAccount');
const claimAccountRouter = require('../routes/api/claimAccount');
const accountsAdminRouter = require('../routes/api/adminBypass');
const randomNumberGeneratorRouter = require('../routes/website/randomNumberGenerator');
const randomQuoteRouter = require('../routes/website/williamwebsite/randomQuote');
const adminHelpRouter = require('../routes/website/adminHelp');
const suggestionsRouter = require('../routes/website/williamwebsite/suggestions');
const submitSuggestionRouter = require('../routes/api/williamwebsite/submitSuggestion');
const williamWebsiteRouter = require('../routes/website/williamwebsite/frontpage');
const submissionsRouter = require('../routes/website/modSubmissions');
const submitArtRouter = require('../routes/website/submitArt');
const uploadArtRouter = require('../routes/api/submitArt');
const fetchSubmissionsRouter = require('../routes/api/fetchSubmissions');
const remoteLoginRouter = require('../routes/website/remoteLogin');
const remoteLoginApiRouter = require('../routes/api/remoteLogin');

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
server.use('/mod-submissions/submitted-art', express.static(path.join(__dirname, '../../art_submissions')));
server.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "img-src": ["'self'", 'data:'],
            "object-src": ["'none'"],
            "frame-ancestors": ["'none'"]
        },
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
server.use('/api', limiter);

async function initializeCors(domain) {
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || origin === domain) {
                callback(null, true);
            } else {
                callback(new Error('Unauthorized domain!'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'x-csrf-token'],
    };
    
    server.use(cors(corsOptions));
}

server.use(cookieParser());
server.use(express.json());

const csrfProtection = csurf({ cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
}});

server.use(csrfProtection);

// Endpoint to retrieve CSRF token
server.get('/api/csrf-token', (req, res) => {
	res.json({ csrfToken: req.csrfToken() });
});

// API routes
server.use('/api/accounts/data', dataRouter);
server.use('/api/accounts/add-empty', addEmptyAccountRouter);
server.use('/api/accounts/claim', claimAccountRouter);
server.use('/api/accounts/admin-bypass', accountsAdminRouter);
server.use('/williamwebsite/api/suggestions/submit', submitSuggestionRouter);
server.use('/api/submit-art/upload', uploadArtRouter);
server.use('/api/mod-submissions/fetch-submissions', fetchSubmissionsRouter);
server.use('/api/remote-login', remoteLoginApiRouter);

// Website routes
server.use('/', homeRouter);
server.use('/random-number-generator', randomNumberGeneratorRouter);
server.use('/accounts', accountsRouter);
server.use('/williamwebsite/random-quote', randomQuoteRouter);
server.use('/accounts/admin-help', adminHelpRouter);
server.use('/williamwebsite/suggestions', suggestionsRouter);
server.use('/williamwebsite', williamWebsiteRouter);
server.use('/mod-submissions', submissionsRouter);
server.use('/mod-submissions/submit-art', submitArtRouter);
server.use('/remote-login', remoteLoginRouter);

module.exports = {server, PORT, initializeCors};
